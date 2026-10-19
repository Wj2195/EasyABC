"""TradeLens online multi-timeframe scanner. Technical-only, non-execution alerts.

Every scanned pair evaluates 15m, 1h and 1d at 1/3/6/12 future-bar horizons.
A Telegram alert requires all THREE fresh, closed-candle forecasts at the SAME
horizon to agree BUY or SELL. Strength is reported but does not block alignment.
"""
import json
import math
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import requests

ROOT = Path(__file__).resolve().parent
PAIRS = 'EUR/USD GBP/USD AUD/USD NZD/USD USD/JPY USD/CHF USD/CAD EUR/GBP EUR/JPY EUR/CHF EUR/AUD EUR/CAD EUR/NZD GBP/JPY GBP/CHF GBP/AUD GBP/CAD GBP/NZD AUD/JPY AUD/CHF AUD/CAD AUD/NZD NZD/JPY NZD/CHF NZD/CAD CAD/JPY CAD/CHF CHF/JPY'.split()
TIMEFRAMES = ('15m', '1h', '1d')
HORIZONS = (1, 3, 6, 12)
SECS = {'15m': 900, '1h': 3600, '1d': 86400}


def iso(epoch=None):
    return datetime.fromtimestamp(time.time() if epoch is None else epoch, timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def get_json(path, fallback):
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else fallback


def save(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(payload, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    tmp.replace(path)


def symbol(pair):
    a, b = pair.split('/')
    return (b if a == 'USD' else a + b) + '=X'


def fetch_bars(pair, tf, session, now):
    url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + symbol(pair)
    limit = {'15m': '1mo', '1h': '3mo', '1d': '5y'}[tf]
    response = session.get(url, params={'interval': tf, 'range': limit},
                           headers={'User-Agent': 'Mozilla/5.0'}, timeout=20)
    response.raise_for_status()
    data = response.json().get('chart', {}).get('result') or []
    if not data:
        raise ValueError('No market candles returned')
    quote = data[0]
    returned = quote.get('meta', {}).get('symbol', '').upper()
    if returned not in (symbol(pair).upper(), pair.replace('/', '') + '=X'):
        raise ValueError('Market symbol mismatch')
    prices = quote['indicators']['quote'][0]
    points = {}
    for i, timestamp in enumerate(quote.get('timestamp', [])):
        try:
            o, h, l, c = (float(prices[k][i]) for k in ('open', 'high', 'low', 'close'))
            if not all(math.isfinite(v) for v in (o, h, l, c)) or o <= 0 or l <= 0:
                continue
            if h < max(o, c) or l > min(o, c):
                continue
            t = int(timestamp)
            if t + SECS[tf] <= now + 1:  # no forming candles
                points[t] = {'t': t, 'o': o, 'h': h, 'l': l, 'c': c}
        except (KeyError, IndexError, ValueError, TypeError):
            continue
    candles = [points[k] for k in sorted(points)]
    if len(candles) < 370:
        raise ValueError(f'Insufficient completed {tf} candles: {len(candles)}')
    return candles[-1500:]


def is_fresh(start_epoch, tf, now):
    age = now - int(start_epoch) - SECS[tf]
    # A Friday daily close remains valid on Monday while 15m/1h must be fresh.
    max_age = 4 * 86400 if tf == '1d' else max(7200, 2 * SECS[tf])
    return -60 <= age <= max_age


def ema(values, size):
    out = np.empty_like(values)
    out[0] = values[0]
    alpha = 2 / (size + 1)
    for i in range(1, len(values)):
        out[i] = out[i-1] + alpha * (values[i] - out[i-1])
    return out


def model_features(candles):
    n = len(candles)
    close = np.array([x['c'] for x in candles])
    high = np.array([x['h'] for x in candles])
    low = np.array([x['l'] for x in candles])
    e20, e50 = ema(close, 20), ema(close, 50)
    s200 = np.convolve(close, np.ones(200)/200, 'full')[:n]
    s20 = np.convolve(close, np.ones(20)/20, 'full')[:n]
    macd = ema(close, 12) - ema(close, 26)
    histogram = macd - ema(macd, 9)
    tr = np.maximum(high-low, np.maximum(abs(high-np.r_[close[0], close[:-1]]),
                                          abs(low-np.r_[close[0], close[:-1]])))
    atr = np.maximum(ema(tr, 27), close*1e-8)
    change = np.diff(close, prepend=close[0])
    up = ema(np.maximum(change, 0), 27)
    down = ema(np.maximum(-change, 0), 27)
    rsi = 100 - 100/(1 + up/np.maximum(down, 1e-12))
    roc = (close - np.r_[close[:10], close[:-10]])/atr
    features = np.empty((n, 9))
    features[:, 0] = np.clip((e20-e50)/atr/3, -1, 1)
    features[:, 1] = np.clip((close-s200)/atr/6, -1, 1)
    features[:, 2] = rsi/50-1
    features[:, 3] = np.clip(histogram/atr, -1, 1)
    for i in range(n):
        std = np.std(close[max(0, i-19):i+1])
        lower = np.min(low[max(0, i-50):i+1])
        upper = np.max(high[max(0, i-50):i+1])
        features[i, 4] = np.clip(abs(e20[i]-e50[i])/atr[i]/3, 0, 1)
        features[i, 5] = np.clip((close[i]-s20[i])/max(std, 1e-12)/4, -1, 1)
        features[i, 6] = np.clip(roc[i]/5, -1, 1)
        features[i, 7] = np.clip(atr[i]/close[i]*20, 0, 1)
        features[i, 8] = np.clip(2*(close[i]-lower)/max(upper-lower, 1e-12)-1, -1, 1)
    return close, atr, features


def forecast(model, horizon):
    close, atr, features = model
    last = len(close) - 1
    samples = []
    counts = [0, 0, 0]
    for i in range(last-horizon-1, 198, -horizon):
        move = (close[i+horizon]-close[i])/atr[i]
        boundary = .35*math.sqrt(horizon)
        label = 2 if move > boundary else 0 if move < -boundary else 1
        counts[label] += 1
        samples.append((float(np.sum((features[last]-features[i])**2)), label))
    if len(samples) < 45:
        raise ValueError('Insufficient historical analogs')
    k = min(50, max(20, math.isqrt(len(samples))*3))
    near = sorted(samples)[:k]
    probs = [8*(count+1)/(len(samples)+3) for count in counts]
    for _, label in near:
        probs[label] += 1
    down, side, up = [100*x/(k+8) for x in probs]
    bias = 'BUY' if up > down else 'SELL' if down > up else 'TIE'
    return {
        'up': round(up, 3), 'down': round(down, 3),
        'sideways': round(side, 3), 'bias': bias,
        'signal': round(max(up, down), 3), 'gap': round(abs(up-down), 3),
        'direction_leads': max(up, down) > side and up != down,
        'top_outcome': 'BUY' if up > max(down, side) else 'SELL' if down > max(up, side) else 'SIDEWAYS',
        'price': round(float(close[-1]), 6)
    }


def alignment(timeframes, horizon, min_signal, min_gap):
    forecasts = []
    for tf in TIMEFRAMES:
        entry = timeframes.get(tf, {})
        f = entry.get('forecasts', {}).get(str(horizon))
        if entry.get('status') != 'Updated' or not f:
            return {'bias': 'WAIT', 'aligned': False, 'eligible': False,
                    'reason': f'{tf}: {entry.get("status", "missing")}'}
        forecasts.append(f)
    biases = [f['bias'] for f in forecasts]
    if biases[0] not in ('BUY', 'SELL') or len(set(biases)) != 1:
        return {'bias': 'MIXED', 'aligned': False, 'eligible': False,
                'reason': 'Timeframes disagree'}
    strong = all(f.get('direction_leads') and f.get('signal', 0) >= min_signal
                 and f.get('gap', 0) >= min_gap for f in forecasts)
    return {'bias': biases[0], 'aligned': True, 'eligible': True, 'strong': strong,
            'reason': 'All 3 timeframes agree; stronger technical confirmation' if strong
                      else 'All 3 timeframes agree; low strength / sideways risk',
            'minimum_signal': round(min(f['signal'] for f in forecasts), 3),
            'minimum_gap': round(min(f['gap'] for f in forecasts), 3)}


def telegram_alert_group(pair, matches, row):
    lines = []
    for horizon, result in matches:
        values = [row['timeframes'][tf]['forecasts'][str(horizon)] for tf in TIMEFRAMES]
        signal_scores = ' / '.join(f'{f["signal"]:.1f}%' for f in values)
        strength = 'STRONG' if result.get('strong') else 'LOW STRENGTH'
        lines.append(f'{horizon}-bar: {result["bias"]} (15m/1h/1D: {signal_scores}) · {strength}')
    return ('TradeLens · 3/3 TIMEFRAME ALIGNMENT\n'
            f'{pair} · NEW ALIGNED FORECASTS\n' + '\n'.join(lines) + '\n'
            f'Last 15m candle: {row["timeframes"]["15m"]["candle_time"]} UTC\n'
            'Bias means BUY stronger than SELL (or vice versa), even if SIDEWAYS is highest.\n'
            'Experimental WATCH signals, not guaranteed entries or win rates. Verify spread/news and risk.')


def send_telegram(session, token, chat, message):
    try:
        response = session.post('https://api.telegram.org/bot'+token+'/sendMessage',
                                json={'chat_id': chat, 'text': message, 'disable_web_page_preview': True},
                                timeout=15)
        response.raise_for_status()
        return bool(response.json().get('ok'))
    except (requests.RequestException, ValueError):
        return False


def scan(base=ROOT, session_factory=requests.Session, fetch=fetch_bars, send=send_telegram,
         now=None, sleep=time.sleep):
    now = time.time() if now is None else now
    cfg = get_json(base/'config.json', {})
    watch = [p for p in cfg.get('watchlist', []) if p in PAIRS]
    state = get_json(base/'state/state.json', {'run_index': 0, 'last_alerts': {}, 'history': []})
    snap = get_json(base/'data/snapshot.json', {'rows': {}})
    rows = {p: snap.get('rows', {}).get(p, {'pair': p, 'ready': False, 'status': 'Pending'}) for p in PAIRS}
    run_index = int(state.get('run_index', 0))
    others = [p for p in PAIRS if p not in watch]
    batch = max(1, min(len(PAIRS), int(cfg.get('batch_size', 7))))
    rotating = [others[(run_index*batch+i) % len(others)] for i in range(min(batch, len(others)))] if others else []
    targets = list(dict.fromkeys(watch + rotating))
    min_signal = float(cfg.get('min_signal', 35))
    min_gap = float(cfg.get('min_gap', 7))
    alert_horizons = [int(h) for h in cfg.get('alert_horizons', [1, 3, 6, 12]) if int(h) in HORIZONS]
    token = os.getenv('TELEGRAM_BOT_TOKEN', '')
    chat = os.getenv('TELEGRAM_CHAT_ID', '')
    last_alerts = state.setdefault('last_alerts', {})
    history = state.setdefault('history', [])
    errors = []
    sent = 0
    with session_factory() as session:
        for position, pair in enumerate(targets):
            if position:
                sleep(float(cfg.get('request_delay_seconds', .5)))
            timeframes = {}
            pair_errors = []
            for tf in TIMEFRAMES:
                try:
                    candles = fetch(pair, tf, session, now)
                    model = model_features(candles)
                    fcs = {str(h): forecast(model, h) for h in HORIZONS}
                    epoch = candles[-1]['t']
                    fresh = is_fresh(epoch, tf, now)
                    timeframes[tf] = {'status': 'Updated' if fresh else 'Old / closed',
                        'candle_epoch': epoch, 'candle_time': iso(epoch),
                        'price': candles[-1]['c'],
                        'candles': candles[-60:], 'forecasts': fcs}
                except (requests.RequestException, ValueError, KeyError, TypeError, IndexError) as exc:
                    timeframes[tf] = {'status': 'Unavailable', 'error': str(exc)[:130]}
                    pair_errors.append(f'{pair} {tf}: {type(exc).__name__}: {str(exc)[:90]}')
            alignments = {str(h): alignment(timeframes, h, min_signal, min_gap) for h in HORIZONS}
            fully_fresh = all(timeframes[tf]['status'] == 'Updated' for tf in TIMEFRAMES)
            row = {'pair': pair, 'ready': fully_fresh, 'status': 'Updated' if fully_fresh else 'Incomplete / old',
                   'checked_at': iso(now), 'timeframes': timeframes, 'alignments': alignments}
            rows[pair] = row
            errors.extend(pair_errors)
            pending = []
            for h in HORIZONS:
                if h not in alert_horizons:
                    continue
                result = alignments[str(h)]
                key = f'{pair}|{h}'
                if not result['eligible']:
                    # An actual fully-fresh change resets dedupe; data outages never do.
                    if fully_fresh:
                        last_alerts.pop(key, None)
                    continue
                if last_alerts.get(key) != result['bias']:
                    pending.append((h, result))
            if pending and token and chat and cfg.get('enable_telegram', True):
                if send(session, token, chat, telegram_alert_group(pair, pending, row)):
                    sent += 1
                    for h, result in pending:
                        last_alerts[f'{pair}|{h}'] = result['bias']
                        history.append({'pair': pair, 'bias': result['bias'], 'horizon': h,
                                        'at': iso(now), 'minimum_signal': result.get('minimum_signal'),
                                        'strong': result.get('strong', False)})
                else:
                    errors.append(f'{pair}: Telegram delivery failed')
    state['run_index'] = run_index + 1
    state['history'] = history[-150:]
    state['last_run'] = iso(now)
    output = {'app': 'TradeLens Online', 'version': '1.2.0', 'updated_at': iso(now),
        'model': 'Experimental 9-feature technical analog (no macro/news overlay)',
        'provider': 'Unofficial Yahoo Finance',
        'settings': {**cfg, 'alert_horizons': alert_horizons, 'timeframes': list(TIMEFRAMES),
                     'horizons': list(HORIZONS)},
        'status': {'pairs_checked_this_run': len(targets), 'checked_pairs': targets,
                   'errors': errors[:45], 'alerts_sent': sent,
                   'telegram_configured': bool(token and chat)},
        'history': history[-50:], 'rows': rows}
    save(base/'state/state.json', state)
    save(base/'data/snapshot.json', output)
    print(f'TradeLens: scanned {len(targets)} pairs, {len(errors)} errors, {sent} notifications')
    return output


if __name__ == '__main__':
    scan()
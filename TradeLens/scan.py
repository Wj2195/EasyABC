"""TradeLens online multi-timeframe scanner. Technical-only, non-execution alerts.

Every scanned pair evaluates 15m, 1h and 1d at 1/3/6/12 future-bar horizons.
A Telegram alert requires at least 10 of 12 forecasts (10/12, 11/12 or 12/12)
to share one BUY or SELL bias, with all 12 available on fresh closed candles.
One Telegram message per scan lists qualifying pairs. An unchanged direction
can repeat after 15 minutes since its last successful delivery, provided a new
scan still qualifies. A newly confirmed opposite direction can alert immediately.
Strength is reported on the dashboard but does not block alignment.
Scheduled medium/high-impact news warnings are sent before release, independently of alignment.
"""
import json
import math
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import requests

from news import load_calendar, fetch_calendar, upcoming_events, pending_news, news_message, IMPACT_LEVELS
from validation import walk_forward

ROOT = Path(__file__).resolve().parent
PAIRS = 'EUR/USD GBP/USD AUD/USD NZD/USD USD/JPY USD/CHF USD/CAD EUR/GBP EUR/JPY EUR/CHF EUR/AUD EUR/CAD EUR/NZD GBP/JPY GBP/CHF GBP/AUD GBP/CAD GBP/NZD AUD/JPY AUD/CHF AUD/CAD AUD/NZD NZD/JPY NZD/CHF NZD/CAD CAD/JPY CAD/CHF CHF/JPY'.split()
TIMEFRAMES = ('15m', '1h', '1d')
HORIZONS = (1, 3, 6, 12)
SECS = {'15m': 900, '1h': 3600, '1d': 86400}
MIN_AGREEMENT = 10
REPEAT_SECONDS = 15 * 60


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
    max_age = 4 * 86400 if tf == '1d' else 2 * SECS[tf]
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


def forecast(model, horizon, origin=None):
    close, atr, features = model
    last = len(close) - 1 if origin is None else origin
    indices = np.arange(last-horizon-1, 198, -horizon)
    if len(indices) < 45:
        raise ValueError('Insufficient historical analogs')
    moves = (close[indices+horizon]-close[indices])/atr[indices]
    boundary = .35*math.sqrt(horizon)
    labels = np.where(moves > boundary, 2, np.where(moves < -boundary, 0, 1))
    counts = np.bincount(labels, minlength=3)
    distances = np.sum((features[last]-features[indices])**2, axis=1)
    k = min(50, max(20, math.isqrt(len(indices))*3))
    near = labels[np.lexsort((labels, distances))[:k]]
    probs = 8*(counts+1)/(len(indices)+3) + np.bincount(near, minlength=3)
    down, side, up = [100*x/(k+8) for x in probs]
    bias = 'BUY' if up > down else 'SELL' if down > up else 'TIE'
    return {
        'up': round(up, 3), 'down': round(down, 3),
        'sideways': round(side, 3), 'bias': bias,
        'signal': round(max(up, down), 3), 'gap': round(abs(up-down), 3),
        'direction_leads': bool(max(up, down) > side and up != down),
        'top_outcome': 'BUY' if up > max(down, side) else 'SELL' if down > max(up, side) else 'SIDEWAYS',
        'price': round(float(close[last]), 6),
        'historical_samples': len(indices), 'nearest_analogs': k
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



def full_alignment(timeframes):
    """Require at least 10/12 agreement; missing data never lowers denominator."""
    biases = []
    for tf in TIMEFRAMES:
        entry = timeframes.get(tf, {})
        if entry.get('status') != 'Updated':
            return {'bias': 'WAIT', 'aligned': False, 'eligible': False,
                    'reason': f'{tf}: missing, stale or unavailable'}
        forecasts = entry.get('forecasts', {})
        for horizon in HORIZONS:
            f = forecasts.get(str(horizon))
            if not isinstance(f, dict) or f.get('bias') not in ('BUY', 'SELL', 'TIE'):
                return {'bias': 'WAIT', 'aligned': False, 'eligible': False,
                        'reason': f'{tf} / {horizon}-bar: no valid forecast'}
            biases.append(f['bias'])
    counts = {b: biases.count(b) for b in ('BUY', 'SELL')}
    direction = max(counts, key=counts.get)
    agreement = counts[direction]
    eligible = agreement >= MIN_AGREEMENT
    supporting = [f for t in timeframes.values() for f in t.get('forecasts', {}).values()
                  if f.get('bias') == direction]
    leads = sum(bool(f.get('direction_leads')) for f in supporting)
    return {'bias': direction if eligible else 'MIXED', 'aligned': eligible,
            'eligible': eligible, 'agreement': agreement, 'total': 12,
            'buy_count': counts['BUY'], 'sell_count': counts['SELL'],
            'tie_count': biases.count('TIE'),
            'minimum_agreement': MIN_AGREEMENT, 'direction_leads_count': leads,
            'low_strength': leads < agreement,
            'reason': f'{agreement}/12 agree {direction}; 10/12 required.' +
                      (' Sideways exceeds directional score in some forecasts.' if leads < agreement else '')}

def should_notify(last_delivered, pair, result, now):
    """Repeat a fresh qualifying direction only after its delivery cooldown."""
    if (result.get('eligible') is not True or result.get('bias') not in ('BUY', 'SELL')
            or result.get('agreement', 0) < MIN_AGREEMENT):
        return False
    previous = last_delivered.get(pair)
    return (previous is None or previous['bias'] != result['bias']
            or now - previous['sent_at'] >= REPEAT_SECONDS)


def telegram_alert_summary(alerts):
    """One message, one concise line per qualifying pair."""
    return '\n'.join(f'{pair.replace("/", "")} - {direction} ({agreement}/12)'
                     for pair, direction, agreement in alerts)


def alert_memory(state):
    """Migrate recorded delivery times; legacy direction latches cannot block repeats."""
    memory = state.setdefault('last_signal_deliveries', {})
    for event in state.get('history', []):
        if event.get('rule') not in ('12/12', 'above_10_of_12', 'at_least_10_of_12') or event.get('bias') not in ('BUY', 'SELL'):
            continue
        try:
            when = datetime.fromisoformat(event['at'].replace('Z', '+00:00'))
            if when.tzinfo is None:
                continue
            epoch = when.timestamp()
            pair = event['pair']
        except (KeyError, TypeError, ValueError, OverflowError):
            continue
        if pair not in memory or epoch > memory[pair]['sent_at']:
            memory[pair] = {'bias': event['bias'], 'sent_at': epoch}
    return memory


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
         now=None, sleep=time.sleep, news_fetch=fetch_calendar, clock=time.time):
    if now is None:
        now = clock()
    else:
        clock = lambda: now  # deterministic injected time for offline tests
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
    token = os.getenv('TELEGRAM_BOT_TOKEN', '')
    chat = os.getenv('TELEGRAM_CHAT_ID', '')
    last_alerts = state.setdefault('last_alerts', {})
    # Migrate v1.2 horizon-based deduplication so previously notified pairs
    # do not immediately get a duplicate notification after this upgrade.
    for pair in PAIRS:
        pair_key = f'pair:{pair}'
        legacy_directions = {last_alerts.get(f'{pair}|{h}') for h in HORIZONS}
        legacy_directions.discard(None)
        if pair_key not in last_alerts and len(legacy_directions) == 1:
            last_alerts[pair_key] = next(iter(legacy_directions))
        for h in HORIZONS:
            last_alerts.pop(f'{pair}|{h}', None)
    history = state.setdefault('history', [])
    errors = []
    sent = 0
    pending_alerts = []
    full_alerts = alert_memory(state)
    news_sent = 0
    with session_factory() as session:
        calendar = load_calendar(session, state, now, fetch=news_fetch)
        events = upcoming_events(calendar, PAIRS, now)
        news_ledger = state.setdefault('news_delivered', {})
        news_history = state.setdefault('news_history', [])
        lead = max(15, min(1440, int(cfg.get('news_alert_lead_minutes', 60))))
        if not calendar['usable'] or calendar.get('error') or calendar.get('skipped_events'):
            errors.append('News calendar: ' + calendar['status'])
        if token and chat and cfg.get('enable_telegram', True) and cfg.get('enable_news_alerts', True):
            for event in pending_news(events, news_ledger, now, lead):
                if event['epoch'] <= clock():
                    continue  # Fetching the feed or earlier deliveries may take time.
                if send(session, token, chat, news_message(event)):
                    delivered_at = clock()
                    news_ledger[event['id']] = delivered_at
                    news_history.append({**event, 'sent_at': iso(delivered_at)})
                    news_sent += 1
                else:
                    errors.append('Telegram news delivery failed')
        state['news_delivered'] = {k: v for k, v in news_ledger.items() if now-v < 30*86400}
        state['news_history'] = news_history[-100:]
        for position, pair in enumerate(targets):
            if position:
                sleep(float(cfg.get('request_delay_seconds', .5)))
            timeframes = {}
            pair_errors = []
            checked_at = clock()
            for tf in TIMEFRAMES:
                try:
                    candles = fetch(pair, tf, session, checked_at)
                    model = model_features(candles)
                    fcs = {str(h): forecast(model, h) for h in HORIZONS}
                    validation = {str(h): walk_forward(model, candles, h, forecast) for h in HORIZONS}
                    epoch = candles[-1]['t']
                    fresh = is_fresh(epoch, tf, checked_at)
                    timeframes[tf] = {'status': 'Updated' if fresh else 'Old / closed',
                        'candle_epoch': epoch, 'candle_time': iso(epoch),
                        'price': candles[-1]['c'],
                        'candles': candles[-60:], 'forecasts': fcs, 'validation': validation}
                except (requests.RequestException, ValueError, KeyError, TypeError, IndexError) as exc:
                    timeframes[tf] = {'status': 'Unavailable', 'error': str(exc)[:130]}
                    pair_errors.append(f'{pair} {tf}: {type(exc).__name__}: {str(exc)[:90]}')
            alignments = {str(h): alignment(timeframes, h, min_signal, min_gap) for h in HORIZONS}
            fully_fresh = all(timeframes[tf]['status'] == 'Updated' for tf in TIMEFRAMES)
            twelve = full_alignment(timeframes)
            row = {'pair': pair, 'ready': fully_fresh, 'status': 'Updated' if fully_fresh else 'Incomplete / old',
                   'checked_at': iso(checked_at), 'timeframes': timeframes,
                   'alignments': alignments, 'full_alignment': twelve}
            rows[pair] = row
            errors.extend(pair_errors)
        # Recheck freshness at send time. Never repeat from a cached prior scan.
        decision_at = clock()
        for pair in targets:
            timeframes = rows[pair]['timeframes']
            for tf, entry in timeframes.items():
                if entry.get('status') == 'Updated' and not is_fresh(entry['candle_epoch'], tf, decision_at):
                    entry['status'] = 'Old / closed'
            result = full_alignment(timeframes)
            if should_notify(full_alerts, pair, result, decision_at):
                pending_alerts.append((pair, result['bias'], result['agreement']))
        # One concise message for all due pairs, including unchanged reminders.
        if pending_alerts and token and chat and cfg.get('enable_telegram', True):
            message = telegram_alert_summary(pending_alerts)
            if send(session, token, chat, message):
                sent = 1
                delivered_at = clock()
                for pair, direction, agreement in pending_alerts:
                    full_alerts[pair] = {'bias': direction, 'sent_at': delivered_at}
                    history.append({
                        'pair': pair, 'bias': direction, 'rule': 'at_least_10_of_12',
                        'agreement': agreement, 'total': 12,
                        'horizons': list(HORIZONS), 'at': iso(delivered_at),
                    })
            else:
                errors.append('Telegram summary delivery failed')
    # Re-evaluate cached rows against current time. Rotating pairs must never
    # retain an old "eligible" flag after their candles have expired.
    finished_at = clock()
    for row in rows.values():
        timeframes = row.get('timeframes', {})
        for tf, entry in timeframes.items():
            if entry.get('status') == 'Updated' and not is_fresh(entry.get('candle_epoch', 0), tf, finished_at):
                entry['status'] = 'Old / closed'
        row['full_alignment'] = full_alignment(timeframes)
        row['alignments'] = {str(h): alignment(timeframes, h, min_signal, min_gap) for h in HORIZONS}
        row['news_events'] = [e for e in events if row.get('pair') in e['pairs']]
        row['ready'] = all(timeframes.get(tf, {}).get('status') == 'Updated' for tf in TIMEFRAMES)
        row['status'] = 'Updated' if row['ready'] else 'Incomplete / old'
    state['run_index'] = run_index + 1
    state['history'] = history[-150:]
    state['last_run'] = iso(finished_at)
    output = {'app': 'TradeLens Online', 'version': '1.5.2', 'updated_at': iso(finished_at),
        'model': '9-feature technical analog; walk-forward diagnostics; separate scheduled news warnings',
        'provider': 'Unofficial Yahoo Finance',
        'settings': {**cfg, 'alert_rule': 'at_least_10_of_12', 'minimum_agreement': MIN_AGREEMENT,
                     'repeat_alert_minutes': REPEAT_SECONDS // 60,
                     'news_alert_lead_minutes': lead, 'news_impact_levels': list(IMPACT_LEVELS),
                     'alert_horizons': list(HORIZONS),
                     'timeframes': list(TIMEFRAMES), 'horizons': list(HORIZONS)},
        'status': {'pairs_checked_this_run': len(targets), 'checked_pairs': targets,
                   'errors': errors[:45], 'alerts_sent': sent, 'news_alerts_sent': news_sent,
                   'telegram_configured': bool(token and chat)},
        'news': {**calendar, 'events': events, 'history': state['news_history'][-20:]},
        'history': history[-50:], 'rows': rows}
    save(base/'state/state.json', state)
    save(base/'data/snapshot.json', output)
    print(f'TradeLens: scanned {len(targets)} pairs, {len(errors)} errors, {sent} signal messages, {news_sent} news messages')
    return output


if __name__ == '__main__':
    scan()

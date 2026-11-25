"""Read-only public account watch. Never logs in, copies trades or sends orders."""
import copy
import math
import re
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

from freshness import is_fresh

LEADERBOARD = 'https://www.myfxbook.com/systems/1'
REFRESH_SECONDS = 900
MAX_CACHE_AGE = 1800
MAX_ACCOUNT_AGE = 1800
SOURCE = 'Myfxbook public real-account leaderboard'
RANKING = ('Top 3 distinct owners by reported total gain on the public leaderboard; '
           'advertisements excluded. Full-account returns may include Gold or other assets. '
           'Displayed trades are forex only. This is not a worldwide or risk-adjusted ranking.')


def iso(epoch):
    return datetime.fromtimestamp(epoch, timezone.utc).isoformat().replace('+00:00', 'Z')


def number(value):
    try:
        result = float(str(value).replace(',', '').replace('%', '').replace('\u2212', '-').strip())
        return result if math.isfinite(result) else None
    except (ValueError, TypeError):
        return None


def text(node):
    return node.get_text(' ', strip=True) if node else ''


def profile_url(value):
    url = urljoin(LEADERBOARD, value)
    parsed = urlparse(url)
    if (parsed.scheme != 'https' or parsed.netloc != 'www.myfxbook.com'
            or not re.fullmatch(r'/members/[^/]+/[^/]+/\d+', parsed.path)):
        raise ValueError('Unexpected public profile URL')
    return url


def parse_leaderboard(html):
    page = BeautifulSoup(html, 'html.parser')
    table = page.select_one('#systemsContTable')
    account_type = page.select_one('#accountTypeSelect option[selected]')
    if table is None or account_type is None or account_type.get('value') != '2':
        raise ValueError('Real-account leaderboard unavailable or layout changed')
    candidates = []
    for row in table.select('tr'):
        if row.select_one('.ad-badge'):
            continue
        item = row.select_one('input[data-oid][data-gain][data-name]')
        if item is None:
            continue
        link = row.select_one('a[id^="system-name-"]')
        gain = number(item.get('data-gain'))
        if link is None or gain is None:
            raise ValueError('Incomplete leaderboard record')
        url = profile_url(link.get('href', ''))
        owner = urlparse(url).path.split('/')[2]
        cells = row.find_all('td', recursive=False)
        candidates.append({'id': item['data-oid'], 'name': item['data-name'][:150],
            'owner': owner, 'profile_url': url, 'gain_pct': gain,
            'drawdown_pct': number(text(cells[4])) if len(cells) > 4 else None})
    # Reject a changed/default sorting rather than presenting page 1 as a top rank.
    if not candidates or any(a['gain_pct'] < b['gain_pct'] for a, b in zip(candidates, candidates[1:])):
        raise ValueError('Gain-sorted leaderboard unavailable')
    selected, owners = [], set()
    for item in candidates:
        owner = item['owner'].casefold()
        if owner not in owners:
            selected.append({**item, 'rank': len(selected) + 1})
            owners.add(owner)
        if len(selected) == 3:
            break
    return selected


def published_time(page, now):
    node = page.select_one('#lastUpdatedTime')
    label = text(node)
    # Relative source times are approximate; a fresh HTTP response is not a
    # fresh broker update. Unrecognised dates fail closed.
    if re.fullmatch(r'(just now|a few seconds ago|less than a minute ago)', label, re.I):
        return now, label
    match = re.fullmatch(r'(\d+|a|an|one)\s+(second|minute|hour|day)s?\s+ago', label, re.I)
    if not match:
        return None, label or 'Source update time unavailable'
    amount = 1 if not match[1].isdigit() else int(match[1])
    age = amount * {'second': 1, 'minute': 60, 'hour': 3600, 'day': 86400}[match[2].lower()]
    return now - age, label


def forex_pair(symbol, allowed_pairs):
    # Recognise only the existing forex universe and common broker suffixes.
    # Gold aliases, other metals, indices and crypto never pass this allowlist.
    raw = symbol.strip().upper()
    if any(tag in raw for tag in ('XAU', 'GOLD')):
        return None
    match = re.fullmatch(r'([A-Z]{3})/?([A-Z]{3})(?:[._-][A-Z0-9]+|[A-Z]{1,3})?', raw)
    pair = match[1] + '/' + match[2] if match else None
    return pair if pair in allowed_pairs else None


def parse_profile(html, account, allowed_pairs, now):
    page = BeautifulSoup(html, 'html.parser')
    record = copy.deepcopy(account)
    record.update(positions=[], checked_at=iso(now))
    verified = all('checked' in (page.select_one('#' + key).get('class', [])
                   if page.select_one('#' + key) else [])
                   for key in ('trackRecordDiv', 'tradingPrivilegesDiv'))
    real = text(page.select_one('.portfolio-resolve-account-type')).startswith('Real ')
    epoch, label = published_time(page, now)
    record.update(verified=verified and real, source_updated_at=iso(epoch) if epoch is not None else None,
                  source_update_label=label)
    if not record['verified']:
        record['status'] = 'Real account / verification could not be confirmed'
        return record
    container = page.select_one('#openTradesCont')
    if container is None:
        record['status'] = 'Open positions unavailable / source layout changed'
        return record
    if re.search(r'open trades are private|unlock|subscribe to view', text(container), re.I):
        record['status'] = 'Positions private — not disclosed'
        return record
    if epoch is None or not 0 <= now - epoch <= MAX_ACCOUNT_AGE:
        record['status'] = 'Provider data stale / update time unknown'
        return record
    table = container.select_one('#tradingOpenTradesTable')
    if table is None:
        record['status'] = 'Open positions unavailable / source layout changed'
        return record
    headers = [next((c for c in cell.get('class', []) if c in
               ('symbol', 'action', 'openPrice', 'openDate', 'sl', 'tp')), '')
               for cell in table.select('thead tr th')]
    if not {'symbol', 'action', 'openPrice'}.issubset(headers):
        record['status'] = 'Open positions unavailable / source layout changed'
        return record
    positions, seen, excluded, rejected = [], set(), 0, 0
    for row in table.select('tbody tr'):
        if 'tableFooter' in row.get('class', []):
            continue
        cells = row.find_all('td', recursive=False)
        if len(cells) < len(headers):
            rejected += 1
            continue
        fields = dict(zip(headers, cells))
        pair = forex_pair(text(fields['symbol']), allowed_pairs)
        if pair is None:
            excluded += 1
            continue
        direction = text(fields['action']).upper()
        if direction not in ('BUY', 'SELL'):
            rejected += 1  # Pending orders are never open positions.
            continue
        entry = number(text(fields['openPrice']))
        if entry is None or entry <= 0:
            rejected += 1
            continue
        identity = row.get('data-record') or row.get('data-ticket-number')
        if not identity or identity in seen:
            rejected += 1
            continue
        seen.add(identity)
        # Read explicit price spans only. Pips and account-currency amounts
        # share these cells and must never be mistaken for price levels.
        sl = number(text(row.select_one('.slPrice')))
        tp = number(text(row.select_one('.tpPrice')))
        broker_time = text(row.select_one('.brokerTime')) or text(fields.get('openDate'))
        positions.append({'id': identity, 'pair': pair, 'direction': direction,
            'entry': entry, 'take_profit': tp if tp is not None and tp > 0 else None,
            'stop_loss': sl if sl is not None and sl > 0 else None,
            'opened_broker_time': broker_time[:60], 'observed_at': iso(epoch)})
    record.update(positions=positions[:100], excluded_non_forex=excluded,
                  rejected_rows=rejected, truncated=len(positions) > 100,
                  status='Published forex positions' if positions else
                  'No public forex positions' if not rejected else 'Position data incomplete')
    return record


def get_page(session, url):
    response = session.get(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; TradeLens/1.6)'}, timeout=15)
    response.raise_for_status()
    if len(response.content) > 3_000_000:
        raise ValueError('Public page exceeded size limit')
    return response.text


def unavailable(now, reason):
    return {'source': SOURCE, 'source_url': LEADERBOARD, 'ranking': RANKING,
            'status': reason, 'usable': False, 'checked_at': iso(now), 'accounts': []}


def load_experts(session, state, now, allowed_pairs, fetch=get_page):
    cache = state.setdefault('expert_watch', {})
    if now - cache.get('last_attempt', 0) >= REFRESH_SECONDS:
        cache['last_attempt'] = now
        try:
            accounts = parse_leaderboard(fetch(session, LEADERBOARD))
            results = []
            for account in accounts:
                try:
                    results.append(parse_profile(fetch(session, account['profile_url']), account, allowed_pairs, now))
                except (requests.RequestException, ValueError, TypeError, KeyError):
                    results.append({**account, 'positions': [], 'verified': False,
                                    'status': 'Public profile unavailable', 'checked_at': iso(now)})
            cache['data'] = {'source': SOURCE, 'source_url': LEADERBOARD, 'ranking': RANKING,
                'status': 'Public snapshot — may lag broker activity', 'usable': True,
                'checked_at': iso(now), 'accounts': results}
            cache['error'] = None
        except (requests.RequestException, ValueError, TypeError, KeyError):
            cache['error'] = 'Expert source unavailable / layout changed'
    data = copy.deepcopy(cache.get('data'))
    # Failed refreshes suppress positions immediately, even if a cache exists:
    # a newly private/closed position must not continue to look live.
    if cache.get('error'):
        return unavailable(now, cache['error'])
    if not data:
        return unavailable(now, 'Awaiting public expert data')
    try:
        age = now - datetime.fromisoformat(data['checked_at'].replace('Z', '+00:00')).timestamp()
    except (ValueError, KeyError, TypeError):
        age = MAX_CACHE_AGE + 1
    if not 0 <= age <= MAX_CACHE_AGE:
        return unavailable(now, 'Expert snapshot stale')
    for account in data['accounts']:
        try:
            published = datetime.fromisoformat(account['source_updated_at'].replace('Z', '+00:00')).timestamp()
            current = 0 <= now - published <= MAX_ACCOUNT_AGE
        except (ValueError, KeyError, TypeError, AttributeError):
            current = False
        if account.get('positions') and not current:
            account.update(positions=[], status='Provider data stale / update time unknown')
    return data


def reference_estimate(position, rows, now):
    """Illustrative volatility levels from a fresh 1h close, not expert orders."""
    if position.get('direction') not in ('BUY', 'SELL'):
        return None
    timeframe = rows.get(position['pair'], {}).get('timeframes', {}).get('1h', {})
    if timeframe.get('status') != 'Updated' or not is_fresh(timeframe.get('candle_epoch'), '1h', now):
        return None
    candles = timeframe.get('candles', [])
    if len(candles) < 15:
        return None
    try:
        ranges = [max(b['h'] - b['l'], abs(b['h'] - a['c']), abs(b['l'] - a['c']))
                  for a, b in zip(candles, candles[1:])]
        atr = sum(ranges[:14]) / 14
        for value in ranges[14:]:
            atr = (atr * 13 + value) / 14
        price = candles[-1]['c']
        if not all(math.isfinite(v) and v > 0 for v in (price, atr)):
            return None
        direction = 1 if position['direction'] == 'BUY' else -1
        tp, sl = price + direction * 3 * atr, price - direction * 1.5 * atr
        if min(tp, sl) <= 0:
            return None
        digits = 3 if position['pair'].endswith('/JPY') else 5
        if (round(tp, digits) == round(price, digits)
                or round(sl, digits) == round(price, digits)):
            return None
        return {'take_profit': round(tp, digits), 'stop_loss': round(sl, digits),
                'reference_price': round(price, digits), 'candle_time': timeframe['candle_time'],
                'method': 'Illustrative: latest 1h close, TP 3 × ATR(14), SL 1.5 × ATR(14). Not expert orders.'}
    except (KeyError, TypeError, ValueError):
        return None


def with_estimates(data, rows, now):
    output = copy.deepcopy(data)
    for account in output.get('accounts', []):
        for position in account.get('positions', []):
            position['estimate'] = reference_estimate(position, rows, now)
    return output

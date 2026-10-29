"""Scheduled medium/high-impact warnings before release, independent of technical signals."""
import hashlib
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import requests

FEED_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'
SOURCE_URL = 'https://www.forexfactory.com/calendar'
REFRESH_SECONDS = 3600
MAX_CACHE_AGE = 3 * 3600
IMPACT_LEVELS = ('Medium', 'High')
CACHE_SCHEMA_VERSION = 2
MYT = ZoneInfo('Asia/Kuala_Lumpur')


def utc_iso(epoch):
    return datetime.fromtimestamp(epoch, timezone.utc).isoformat().replace('+00:00', 'Z')


def week_start(now):
    local = datetime.fromtimestamp(now, ZoneInfo('America/New_York'))
    return (local - timedelta(days=(local.weekday() + 1) % 7)).replace(
        hour=0, minute=0, second=0, microsecond=0).timestamp()


def fetch_calendar(session):
    response = session.get(FEED_URL, headers={'User-Agent': 'TradeLens/1.5 calendar'}, timeout=20)
    response.raise_for_status()
    return response.json()


def parse_calendar(payload, now):
    if not isinstance(payload, list) or not payload:
        raise ValueError('Calendar feed is empty or not an event list')
    events, dates, skipped = {}, [], 0
    for item in payload:
        if not isinstance(item, dict):
            skipped += 1
            continue
        impact = str(item.get('impact', '')).strip().title()
        relevant = impact in IMPACT_LEVELS
        try:
            dt = datetime.fromisoformat(str(item['date']).replace('Z', '+00:00'))
            if dt.tzinfo is None:
                raise ValueError('Calendar time has no UTC offset')
            epoch = dt.timestamp()
            dates.append(epoch)
            if not relevant:
                continue
            currency = str(item.get('country', '')).strip().upper()
            title = ' '.join(str(item.get('title', '')).split())[:200]
            if not title or not (len(currency) == 3 and currency.isalpha()):
                raise ValueError('Invalid event currency/title')
            identity = f'{currency}|{title.casefold()}|{int(epoch)}'
            event_id = hashlib.sha256(identity.encode()).hexdigest()[:24]
            events[event_id] = {'id': event_id, 'title': title, 'currency': currency,
                'impact': impact, 'epoch': epoch, 'at': utc_iso(epoch),
                'time_myt': dt.astimezone(MYT).strftime('%d %b %Y, %I:%M %p MYT'),
                'forecast': str(item.get('forecast', ''))[:60],
                'previous': str(item.get('previous', ''))[:60]}
        except (KeyError, ValueError, TypeError, OverflowError):
            if relevant:
                skipped += 1
    start = week_start(now)
    if not dates or not any(start <= t < start + 8 * 86400 for t in dates):
        raise ValueError('Calendar feed does not cover the current week')
    return sorted(events.values(), key=lambda e: (e['epoch'], e['currency'], e['title'])), skipped


def load_calendar(session, state, now, fetch=fetch_calendar):
    cache = state.setdefault('news_calendar', {})
    if cache.get('schema_version') != CACHE_SCHEMA_VERSION:
        # Older caches contain High only. Refresh them immediately without
        # touching the separate delivery ledger or resending previous events.
        cache.clear()
        cache['schema_version'] = CACHE_SCHEMA_VERSION
    same_week = cache.get('week_start') == week_start(now)
    if now - cache.get('last_attempt', 0) >= REFRESH_SECONDS or not same_week:
        cache['last_attempt'] = now
        cache['week_start'] = week_start(now)
        try:
            events, skipped = parse_calendar(fetch(session), now)
            cache.update(events=events, fetched_at=now, skipped=skipped, error=None)
        except (requests.RequestException, ValueError, TypeError, KeyError) as exc:
            cache['error'] = f'Calendar unavailable: {type(exc).__name__}'
    age = now - cache.get('fetched_at', 0)
    fresh_week = cache.get('fetched_at', 0) >= week_start(now)
    usable = fresh_week and 0 <= age <= MAX_CACHE_AGE and 'events' in cache
    status = ('Cached / feed retry pending' if cache.get('error') else
              'Partial calendar' if cache.get('skipped') else 'Updated') if usable else 'Unavailable / stale'
    return {'source': 'Forex Factory weekly calendar', 'source_url': SOURCE_URL,
            'impact_levels': list(IMPACT_LEVELS),
            'status': status, 'usable': usable,
            'checked_at': utc_iso(cache['fetched_at']) if cache.get('fetched_at') else None,
            'error': cache.get('error'), 'skipped_events': cache.get('skipped', 0),
            'events': cache.get('events', []) if usable else [],
            'coverage': 'Current provider week; scheduled events only. Times can change. Unscheduled breaking news is not covered.'}


def affected_pairs(currency, pairs):
    return [p for p in pairs if currency == 'ALL' or currency in p.split('/')]


def upcoming_events(calendar, pairs, now, hours=24):
    if not calendar.get('usable'):
        return []
    output = []
    for event in calendar.get('events', []):
        affected = affected_pairs(event['currency'], pairs)
        if affected and now <= event['epoch'] <= now + hours * 3600:
            output.append({**event, 'pairs': affected})
    return output


def pending_news(events, delivered, now, lead_minutes=60):
    return [e for e in events if e['id'] not in delivered
            and now < e['epoch'] <= now + lead_minutes * 60]


def news_message(event):
    pairs = ', '.join(p.replace('/', '') for p in event['pairs'])
    return (f'NEWS - {event["impact"].upper()} IMPACT EXPECTED\n'
            f'{event["currency"]} - {event["title"]}\n'
            f'Release: {event["time_myt"]}\nPairs: {pairs}')

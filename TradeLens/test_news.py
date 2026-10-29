import copy
import unittest
from datetime import datetime, timezone

import requests

from news import (parse_calendar, load_calendar, affected_pairs, upcoming_events,
                  pending_news, news_message)

NOW = datetime(2026, 10, 29, 11, tzinfo=timezone.utc).timestamp()


def feed():
    return [{'title': 'US Example Release', 'country': 'USD',
             'date': '2026-10-29T07:30:00-04:00', 'impact': 'High',
             'forecast': '2%', 'previous': '1%'}]


class NewsTests(unittest.TestCase):
    def test_offset_time_and_both_currencies(self):
        events, skipped = parse_calendar(feed(), NOW)
        self.assertEqual(skipped, 0)
        self.assertEqual(events[0]['epoch'], NOW + 1800)
        self.assertIn('07:30 PM MYT', events[0]['time_myt'])
        self.assertEqual(affected_pairs('USD', ['EUR/USD', 'USD/JPY', 'EUR/JPY']), ['EUR/USD', 'USD/JPY'])

    def test_high_only_and_duplicate_feed_rows(self):
        low = {**feed()[0], 'impact': 'Low', 'title': 'Minor'}
        events, _ = parse_calendar(feed() + feed() + [low], NOW)
        self.assertEqual(len(events), 1)

    def test_invalid_and_unzoned_time_not_guessed(self):
        events, skipped = parse_calendar(feed() + [{**feed()[0], 'date': '2026-10-29T10:00:00'}], NOW)
        self.assertEqual(len(events), 1)
        self.assertEqual(skipped, 1)

    def test_past_week_rejected(self):
        old = [{**feed()[0], 'date': '2026-10-12T07:30:00-04:00'}]
        with self.assertRaises(ValueError):
            parse_calendar(old, NOW)

    def test_cache_hourly_failure_and_expiry(self):
        state, calls = {}, []
        def fetch(_):
            calls.append(1)
            return feed()
        first = load_calendar(None, state, NOW, fetch)
        self.assertTrue(first['usable'])
        load_calendar(None, state, NOW + 900, fetch)
        self.assertEqual(len(calls), 1)
        def fail(_):
            raise requests.Timeout()
        cached = load_calendar(None, state, NOW + 3601, fail)
        self.assertTrue(cached['usable'])
        self.assertIn('Cached', cached['status'])
        stale = load_calendar(None, state, NOW + 10801, fail)
        self.assertFalse(stale['usable'])
        self.assertEqual(stale['events'], [])

    def test_calendar_failure_is_not_no_news(self):
        c = load_calendar(None, {}, NOW, lambda _: '<html>failure</html>')
        self.assertFalse(c['usable'])
        self.assertEqual(c['status'], 'Unavailable / stale')

    def test_warnings_independent_of_technical_signals_and_once_per_event(self):
        c = load_calendar(None, {}, NOW, lambda _: feed())
        events = upcoming_events(c, ['EUR/USD', 'USD/JPY', 'EUR/JPY'], NOW)
        self.assertEqual(len(pending_news(events, {}, NOW)), 1)
        self.assertEqual(pending_news(events, {}, NOW + 1801), [])
        self.assertEqual(pending_news(events, {}, NOW - 1801), [])
        delivered = {events[0]['id']: NOW}
        self.assertEqual(pending_news(events, delivered, NOW + 300), [])
        self.assertIn('Pairs: EURUSD, USDJPY', news_message(events[0]))
        self.assertNotIn('BUY', news_message(events[0]))

    def test_reschedule_changes_identity_and_cancelled_event_removed(self):
        state = {}
        first = load_calendar(None, state, NOW, lambda _: feed())
        changed = copy.deepcopy(feed())
        changed[0]['date'] = '2026-10-29T09:30:00-04:00'
        second = load_calendar(None, state, NOW+3601, lambda _: changed)
        self.assertNotEqual(first['events'][0]['id'], second['events'][0]['id'])
        changed[0]['impact'] = 'Low'
        third = load_calendar(None, state, NOW+7202, lambda _: changed)
        self.assertEqual(third['events'], [])

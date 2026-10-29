import copy
import unittest
from datetime import datetime, timezone

import requests

from news import (parse_calendar, load_calendar, affected_pairs, upcoming_events,
                  pending_news, news_message)

NOW = datetime(2026, 10, 29, 11, tzinfo=timezone.utc).timestamp()


def feed(impact='High'):
    return [{'title': 'US Example Release', 'country': 'USD',
             'date': '2026-10-29T07:30:00-04:00', 'impact': impact,
             'forecast': '2%', 'previous': '1%'}]


class NewsTests(unittest.TestCase):
    def test_offset_time_and_both_currencies(self):
        events, skipped = parse_calendar(feed(), NOW)
        self.assertEqual(skipped, 0)
        self.assertEqual(events[0]['epoch'], NOW + 1800)
        self.assertIn('07:30 PM MYT', events[0]['time_myt'])
        self.assertEqual(affected_pairs('USD', ['EUR/USD', 'USD/JPY', 'EUR/JPY']), ['EUR/USD', 'USD/JPY'])

    def test_medium_high_only_and_duplicate_feed_rows(self):
        low = {**feed()[0], 'impact': 'Low', 'title': 'Minor'}
        medium = {**feed('Medium')[0], 'title': 'Medium Example Release'}
        unknown = {**feed()[0], 'impact': 'Holiday', 'title': 'Closed'}
        events, _ = parse_calendar(feed() + feed() + [low, medium, medium, unknown], NOW)
        self.assertEqual(len(events), 2)
        self.assertEqual({e['impact'] for e in events}, {'Medium', 'High'})

    def test_medium_message_is_labelled_and_includes_release_time(self):
        c = load_calendar(None, {}, NOW, lambda _: feed(' medium '))
        event = upcoming_events(c, ['EUR/USD', 'USD/JPY'], NOW)[0]
        message = news_message(event)
        self.assertTrue(message.startswith('NEWS - MEDIUM IMPACT EXPECTED'))
        self.assertIn('Release: 29 Oct 2026, 07:30 PM MYT', message)
        self.assertIn('Pairs: EURUSD, USDJPY', message)

    def test_invalid_and_unzoned_time_not_guessed(self):
        events, skipped = parse_calendar(feed() + [{**feed()[0], 'date': '2026-10-29T10:00:00'}], NOW)
        self.assertEqual(len(events), 1)
        self.assertEqual(skipped, 1)

    def test_invalid_medium_time_is_reported(self):
        events, skipped = parse_calendar(feed() + [{**feed('Medium')[0], 'date': 'Tentative'}], NOW)
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

    def test_high_only_cache_refreshes_and_sent_events_stay_deduplicated(self):
        events, _ = parse_calendar(feed(), NOW)
        event_id = events[0]['id']
        state = {'news_calendar': {'fetched_at': NOW, 'last_attempt': NOW,
                                  'events': events}, 'news_delivered': {event_id: NOW}}
        medium = {**feed('Medium')[0], 'title': 'Medium Example Release'}
        calls = []
        def fetch(_):
            calls.append(1)
            return feed() + [medium]
        calendar = load_calendar(None, state, NOW+300, fetch)
        self.assertEqual(len(calls), 1)
        self.assertEqual(calendar['impact_levels'], ['Medium', 'High'])
        upcoming = upcoming_events(calendar, ['EUR/USD'], NOW+300)
        pending = pending_news(upcoming, state['news_delivered'], NOW+300)
        self.assertEqual([e['impact'] for e in pending], ['Medium'])
        self.assertEqual(state['news_delivered'], {event_id: NOW})

    def test_upgrade_fetch_failure_does_not_claim_medium_coverage(self):
        events, _ = parse_calendar(feed(), NOW)
        state = {'news_calendar': {'fetched_at': NOW, 'last_attempt': NOW, 'events': events}}
        def fail(_):
            raise requests.Timeout()
        calendar = load_calendar(None, state, NOW+300, fail)
        self.assertFalse(calendar['usable'])
        self.assertEqual(calendar['events'], [])

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

    def test_medium_and_high_only_send_before_release_within_one_hour(self):
        for impact in ('Medium', 'High'):
            c = load_calendar(None, {}, NOW, lambda _: feed(impact))
            events = upcoming_events(c, ['EUR/USD'], NOW)
            release = events[0]['epoch']
            self.assertEqual(pending_news(events, {}, release-3601), [])
            self.assertEqual(len(pending_news(events, {}, release-3600)), 1)
            self.assertEqual(len(pending_news(events, {}, release-1)), 1)
            self.assertEqual(pending_news(events, {}, release), [])
            self.assertEqual(pending_news(events, {}, release+1), [])

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

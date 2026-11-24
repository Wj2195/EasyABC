import unittest
from datetime import datetime

from freshness import is_fresh


def epoch(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00')).timestamp()


class DailyFreshnessTests(unittest.TestCase):
    def test_weekend_and_monday_require_friday_not_thursday(self):
        for now in ('2026-11-21T12:00:00Z', '2026-11-22T12:00:00Z',
                    '2026-11-23T22:16:00Z'):
            self.assertTrue(is_fresh(epoch('2026-11-20T00:00:00Z'), '1d', epoch(now)))
            self.assertFalse(is_fresh(epoch('2026-11-19T00:00:00Z'), '1d', epoch(now)))

    def test_tuesday_requires_monday_after_publication_grace(self):
        friday = epoch('2026-11-20T00:00:00Z')
        self.assertTrue(is_fresh(friday, '1d', epoch('2026-11-24T01:59:59Z')))
        self.assertFalse(is_fresh(friday, '1d', epoch('2026-11-24T02:00:00Z')))
        self.assertTrue(is_fresh(epoch('2026-11-23T00:00:00Z'), '1d',
                                 epoch('2026-11-24T02:00:00Z')))

    def test_dst_timestamp_tolerance_is_only_one_hour(self):
        now = epoch('2026-07-07T06:00:00Z')
        self.assertTrue(is_fresh(epoch('2026-07-05T23:00:00Z'), '1d', now))
        self.assertFalse(is_fresh(epoch('2026-07-05T22:59:59Z'), '1d', now))

    def test_missing_malformed_and_forming_candles_fail_closed(self):
        now = epoch('2026-11-24T12:00:00Z')
        for value in (None, 'bad', float('nan'), float('inf'), now):
            self.assertFalse(is_fresh(value, '1d', now))

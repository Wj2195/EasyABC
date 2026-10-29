"""Consensus thresholds, repeat timing and upgrade migration."""
import unittest
from scan import HORIZONS, TIMEFRAMES, full_alignment, telegram_alert_summary, should_notify, alert_memory, iso

NOW = 1793271600


def make_timeframes(direction='BUY', agreement=12):
    output = {tf: {'status': 'Updated', 'forecasts': {str(h): {'bias': direction}
              for h in HORIZONS}} for tf in TIMEFRAMES}
    for tf, h in [(tf, h) for tf in TIMEFRAMES for h in HORIZONS][:12-agreement]:
        output[tf]['forecasts'][str(h)]['bias'] = 'SELL' if direction == 'BUY' else 'BUY'
    return output


class FullAgreementTests(unittest.TestCase):
    def test_ten_eleven_twelve_qualify_for_either_direction(self):
        for direction in ('BUY', 'SELL'):
            for agreement in (10, 11, 12):
                with self.subTest(direction=direction, agreement=agreement):
                    result = full_alignment(make_timeframes(direction, agreement))
                    self.assertTrue(result['eligible'])
                    self.assertEqual(result['agreement'], agreement)
                    self.assertEqual(result['bias'], direction)

    def test_nine_or_lower_never_qualifies(self):
        for agreement in (6, 7, 8, 9):
            result = full_alignment(make_timeframes(agreement=agreement))
            self.assertFalse(result['eligible'])
            self.assertEqual(result['agreement'], agreement)

    def test_missing_forecast_never_reduces_denominator(self):
        x = make_timeframes(agreement=10)
        del x['1d']['forecasts']['6']
        self.assertFalse(full_alignment(x)['eligible'])

    def test_ties_are_non_votes_and_do_not_reduce_denominator(self):
        x = make_timeframes()
        x['15m']['forecasts']['1']['bias'] = 'TIE'
        x['15m']['forecasts']['3']['bias'] = 'TIE'
        self.assertTrue(full_alignment(x)['eligible'])
        self.assertEqual(full_alignment(x)['agreement'], 10)
        x['15m']['forecasts']['6']['bias'] = 'TIE'
        self.assertFalse(full_alignment(x)['eligible'])

    def test_stale_blocks_even_with_twelve_directions(self):
        x = make_timeframes()
        x['1d']['status'] = 'Old / closed'
        self.assertFalse(full_alignment(x)['eligible'])
        self.assertFalse(full_alignment({})['eligible'])

    def test_message_format(self):
        self.assertEqual(telegram_alert_summary([
            ('USD/JPY', 'BUY', 10), ('GBP/JPY', 'SELL', 12)]),
            'USDJPY - BUY (10/12)\nGBPJPY - SELL (12/12)')


class ReminderTests(unittest.TestCase):
    def setUp(self):
        self.ledger = {'EUR/USD': {'bias': 'BUY', 'sent_at': NOW}}
        self.buy = full_alignment(make_timeframes())

    def test_first_signal_and_exact_fifteen_minute_boundary(self):
        self.assertTrue(should_notify({}, 'EUR/USD', self.buy, NOW))
        for offset in (0, 60, 899, 899.999):
            self.assertFalse(should_notify(self.ledger, 'EUR/USD', self.buy, NOW+offset))
        for offset in (900, 901, 1800):
            self.assertTrue(should_notify(self.ledger, 'EUR/USD', self.buy, NOW+offset))

    def test_score_changes_do_not_reset_or_bypass_timer(self):
        for agreement in (10, 11, 12):
            result = full_alignment(make_timeframes(agreement=agreement))
            self.assertFalse(should_notify(self.ledger, 'EUR/USD', result, NOW+899))
            self.assertTrue(should_notify(self.ledger, 'EUR/USD', result, NOW+900))

    def test_mixed_then_qualifying_uses_original_delivery_time(self):
        mixed = full_alignment(make_timeframes(agreement=9))
        self.assertFalse(should_notify(self.ledger, 'EUR/USD', mixed, NOW+900))
        self.assertTrue(should_notify(self.ledger, 'EUR/USD', self.buy, NOW+1800))
        self.assertEqual(self.ledger['EUR/USD']['sent_at'], NOW)

    def test_missing_and_stale_never_repeat(self):
        self.assertFalse(should_notify(self.ledger, 'EUR/USD', full_alignment({}), NOW+900))
        stale = make_timeframes()
        stale['15m']['status'] = 'Old / closed'
        self.assertFalse(should_notify(self.ledger, 'EUR/USD', full_alignment(stale), NOW+900))

    def test_opposite_confirmed_direction_is_immediate(self):
        sell = full_alignment(make_timeframes('SELL', 10))
        self.assertTrue(should_notify(self.ledger, 'EUR/USD', sell, NOW+60))

    def test_cooldown_is_independent_for_each_pair(self):
        self.ledger['USD/JPY'] = {'bias': 'BUY', 'sent_at': NOW-900}
        self.assertFalse(should_notify(self.ledger, 'EUR/USD', self.buy, NOW))
        self.assertTrue(should_notify(self.ledger, 'USD/JPY', self.buy, NOW))


class MigrationTests(unittest.TestCase):
    def test_recent_legacy_history_obeys_remaining_cooldown(self):
        state = {'last_alerts_12of12': {'EUR/USD': 'BUY'}, 'history': [
            {'pair': 'EUR/USD', 'bias': 'BUY', 'rule': '12/12', 'at': iso(NOW-60)}]}
        ledger = alert_memory(state)
        buy = full_alignment(make_timeframes(agreement=10))
        self.assertFalse(should_notify(ledger, 'EUR/USD', buy, NOW))
        self.assertTrue(should_notify(ledger, 'EUR/USD', buy, NOW+840))

    def test_undated_legacy_latch_cannot_block_reminders_forever(self):
        ledger = alert_memory({'last_alerts_12of12': {'EUR/USD': 'BUY'}})
        self.assertTrue(should_notify(ledger, 'EUR/USD', full_alignment(make_timeframes()), NOW))

    def test_history_never_overwrites_newer_delivery(self):
        state = {'last_signal_deliveries': {'EUR/USD': {'bias': 'SELL', 'sent_at': NOW}},
                 'history': [{'pair': 'EUR/USD', 'bias': 'BUY', 'rule': 'above_10_of_12',
                              'at': iso(NOW-900)}]}
        self.assertEqual(alert_memory(state)['EUR/USD'], {'bias': 'SELL', 'sent_at': NOW})

    def test_older_three_of_three_history_is_not_imported(self):
        state = {'history': [{'pair': 'EUR/USD', 'bias': 'BUY', 'rule': '3/3', 'at': iso(NOW)}]}
        self.assertEqual(alert_memory(state), {})


if __name__ == '__main__':
    unittest.main()

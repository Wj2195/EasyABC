import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import scan
from test_news import NOW, feed


class DummySession:
    def __enter__(self):
        return self
    def __exit__(self, *args):
        pass


class DeliveryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.base = Path(self.tmp.name)
        scan.save(self.base/'config.json', {'watchlist': ['EUR/USD'], 'batch_size': 28,
                                          'request_delay_seconds': 0})
        scan.save(self.base/'state/state.json', {'last_alerts_12of12': {'EUR/USD': 'BUY'},
            'history': [{'pair': 'EUR/USD', 'bias': 'BUY', 'rule': '12/12', 'at': scan.iso(NOW)}]})
        self.messages = []

    def tearDown(self):
        self.tmp.cleanup()

    def state(self):
        return json.loads((self.base/'state/state.json').read_text())

    def run_scan(self, success=True, direction='BUY', agreement=12, broken=False, stale=False,
                 now=NOW, news=False, pairs=None, clock=None, after_send=None, credentials=True):
        calls = 0
        def fetch(pair, tf, session, timestamp):
            if broken:
                raise ValueError('Unavailable test data')
            t = int(timestamp)-scan.SECS[tf]-(1801 if stale and tf == '15m' else 0)
            return [{'t': t, 'c': 1., 'o': 1., 'h': 1.1, 'l': .9}]
        def send(session, token, chat, message):
            self.messages.append(message)
            if after_send:
                after_send()
            return success
        def prediction(*args, **kwargs):
            nonlocal calls
            bias = direction if calls % 12 < agreement else ('SELL' if direction == 'BUY' else 'BUY')
            calls += 1
            return {'bias': bias, 'signal': 40., 'gap': 10., 'direction_leads': True}
        with patch.dict(os.environ, {'TELEGRAM_BOT_TOKEN': 'test' if credentials else '',
                                     'TELEGRAM_CHAT_ID': 'test' if credentials else ''}), \
             patch.object(scan, 'PAIRS', pairs or ['EUR/USD']), \
             patch.object(scan, 'model_features', return_value=None), \
             patch.object(scan, 'forecast', side_effect=prediction), \
             patch.object(scan, 'walk_forward', return_value={'samples': 0}):
            return scan.scan(base=self.base, session_factory=DummySession, fetch=fetch, send=send,
                             now=None if clock else now, clock=clock or (lambda: now), sleep=lambda _: None,
                             news_fetch=lambda _: feed() if news else [{**feed()[0], 'impact': 'Low'}])

    def test_persisted_timer_repeats_every_fifteen_minutes(self):
        for elapsed in (60, 899, 900, 901, 1799, 1800):
            self.run_scan(now=NOW+elapsed, agreement=10)
        self.assertEqual(self.messages, ['EURUSD - BUY (10/12)'] * 2)
        self.assertEqual(self.state()['last_signal_deliveries']['EUR/USD']['sent_at'], NOW+1800)
        self.assertEqual(self.state()['history'][-1]['rule'], 'at_least_10_of_12')

    def test_below_ten_stops_reminders_and_fresh_ten_resumes(self):
        self.run_scan(now=NOW+900, agreement=9)
        self.assertEqual(self.messages, [])
        self.run_scan(now=NOW+1800, agreement=10)
        self.assertEqual(self.messages, ['EURUSD - BUY (10/12)'])

    def test_stale_or_failed_fetch_does_not_resend_cached_qualification(self):
        self.run_scan(now=NOW, agreement=12)
        self.run_scan(now=NOW+900, broken=True)
        self.run_scan(now=NOW+1800, stale=True)
        self.assertEqual(self.messages, [])
        self.assertEqual(self.state()['last_signal_deliveries']['EUR/USD']['sent_at'], NOW)

    def test_failed_reminder_retries_without_resetting_cooldown(self):
        self.run_scan(now=NOW+900, success=False)
        self.assertEqual(self.state()['last_signal_deliveries']['EUR/USD']['sent_at'], NOW)
        self.run_scan(now=NOW+960)
        self.run_scan(now=NOW+1000)
        self.assertEqual(self.messages, ['EURUSD - BUY (12/12)'] * 2)
        self.assertEqual(self.state()['last_signal_deliveries']['EUR/USD']['sent_at'], NOW+960)

    def test_news_sends_even_when_all_market_data_unavailable(self):
        output = self.run_scan(broken=True, news=True)
        self.assertEqual(output['status']['news_alerts_sent'], 1)
        self.assertEqual(output['status']['alerts_sent'], 0)
        self.assertIn('NEWS - HIGH IMPACT EXPECTED', self.messages[0])
        self.run_scan(broken=True, now=NOW+60, news=True)
        self.assertEqual(len(self.messages), 1)

    def test_news_failure_retries_without_touching_trade_delivery_time(self):
        self.run_scan(success=False, news=True)
        self.assertEqual(self.state()['news_delivered'], {})
        self.assertEqual(self.state()['last_signal_deliveries']['EUR/USD']['sent_at'], NOW)
        self.run_scan(now=NOW+60, news=True)
        self.assertEqual(len(self.messages), 2)
        self.assertTrue(all(m.startswith('NEWS') for m in self.messages))

    def test_failed_opposite_signal_retries_then_waits_for_fifteen_minutes(self):
        self.run_scan(success=False, direction='SELL')
        self.assertEqual(self.state()['last_signal_deliveries']['EUR/USD']['bias'], 'BUY')
        self.run_scan(direction='SELL', now=NOW+60)
        self.run_scan(direction='SELL', now=NOW+120)
        self.assertEqual(self.messages, ['EURUSD - SELL (12/12)'] * 2)

    def test_news_stays_once_per_event_while_signal_repeats(self):
        self.run_scan(direction='SELL', news=True)
        self.run_scan(direction='SELL', now=NOW+900, news=True)
        self.assertEqual(sum(m.startswith('NEWS') for m in self.messages), 1)
        self.assertEqual(self.messages.count('EURUSD - SELL (12/12)'), 2)

    def test_all_twenty_eight_pairs_are_rechecked_and_grouped(self):
        output = self.run_scan(now=NOW+900, pairs=scan.PAIRS)
        self.assertEqual(output['status']['pairs_checked_this_run'], 28)
        self.assertEqual(len(self.messages), 1)
        self.assertEqual(len(self.messages[0].splitlines()), 28)
        self.run_scan(now=NOW+1800, pairs=scan.PAIRS)
        self.assertEqual(len(self.messages), 2)
        self.assertEqual(len(self.messages[1].splitlines()), 28)

    def test_cooldown_uses_actual_success_time_after_network_delay(self):
        current = [NOW+900]
        def delay():
            current[0] += 90
        self.run_scan(clock=lambda: current[0], after_send=delay)
        self.assertEqual(self.state()['last_signal_deliveries']['EUR/USD']['sent_at'], NOW+990)
        self.run_scan(now=NOW+1800)
        self.assertEqual(len(self.messages), 1)
        self.run_scan(now=NOW+1890)
        self.assertEqual(len(self.messages), 2)

    def test_absent_credentials_do_not_consume_delivery_timer(self):
        self.run_scan(now=NOW+900, credentials=False)
        self.assertEqual(self.messages, [])
        self.assertEqual(self.state()['last_signal_deliveries']['EUR/USD']['sent_at'], NOW)
        self.run_scan(now=NOW+960)
        self.assertEqual(len(self.messages), 1)

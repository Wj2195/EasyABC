"""Strict twelve-forecast agreement checks. Run with python -m unittest."""
import unittest
from scan import HORIZONS, TIMEFRAMES, full_alignment, telegram_alert_summary, should_notify_12of12

def make_timeframes(direction='BUY'):
    return {tf:{'status':'Updated','forecasts':{str(h):{'bias':direction}
            for h in HORIZONS}} for tf in TIMEFRAMES}

class FullAgreementTests(unittest.TestCase):
    def test_everything_buy(self):
        self.assertEqual(full_alignment(make_timeframes('BUY'))['bias'], 'BUY')
        self.assertTrue(full_alignment(make_timeframes('BUY'))['eligible'])
    def test_everything_sell(self):
        self.assertTrue(full_alignment(make_timeframes('SELL'))['eligible'])
    def test_one_opposite_blocks(self):
        x=make_timeframes()
        x['1h']['forecasts']['12']['bias']='SELL'
        self.assertFalse(full_alignment(x)['eligible'])
    def test_missing_forecast_blocks(self):
        x=make_timeframes()
        del x['1d']['forecasts']['6']
        self.assertFalse(full_alignment(x)['eligible'])
    def test_tie_blocks(self):
        x=make_timeframes()
        x['15m']['forecasts']['1']['bias']='TIE'
        self.assertFalse(full_alignment(x)['eligible'])
    def test_stale_blocks(self):
        x=make_timeframes()
        x['1d']['status']='Old / closed'
        self.assertFalse(full_alignment(x)['eligible'])
    def test_empty_blocks(self):
        self.assertFalse(full_alignment({})['eligible'])
    def test_message_format(self):
        self.assertEqual(telegram_alert_summary([
            ('USD/JPY','BUY',[]),('GBP/JPY','SELL',[])]),
            'USDJPY - BUY\nGBPJPY - SELL')

    def test_repeat_direction_suppressed_after_mixed(self):
        ledger = {}
        buy = full_alignment(make_timeframes('BUY'))
        self.assertTrue(should_notify_12of12(ledger, 'EUR/USD', buy))
        ledger['EUR/USD'] = 'BUY'  # bot confirms delivery
        self.assertFalse(should_notify_12of12(ledger, 'EUR/USD', buy))
        mixed = make_timeframes('BUY')
        mixed['1h']['forecasts']['12']['bias'] = 'SELL'
        self.assertFalse(should_notify_12of12(ledger, 'EUR/USD',
                                             full_alignment(mixed)))
        self.assertEqual(ledger['EUR/USD'], 'BUY')
        self.assertFalse(should_notify_12of12(ledger, 'EUR/USD', buy))
    def test_opposite_12of12_delivered_once(self):
        ledger = {'EUR/USD': 'BUY'}
        sell = full_alignment(make_timeframes('SELL'))
        self.assertTrue(should_notify_12of12(ledger, 'EUR/USD', sell))
        ledger['EUR/USD'] = 'SELL'
        self.assertFalse(should_notify_12of12(ledger, 'EUR/USD', sell))
        self.assertTrue(should_notify_12of12(ledger, 'EUR/USD',
                                             full_alignment(make_timeframes('BUY'))))
    def test_failed_delivery_keeps_old_latch(self):
        ledger = {'USD/JPY': 'BUY'}
        sell = full_alignment(make_timeframes('SELL'))
        self.assertTrue(should_notify_12of12(ledger, 'USD/JPY', sell))
        # Mock delivery failure: ledger is only changed in the success branch.
        self.assertEqual(ledger['USD/JPY'], 'BUY')
    def test_missing_data_does_not_rearm(self):
        ledger = {'GBP/JPY': 'SELL'}
        stale = make_timeframes('SELL')
        stale['15m']['status'] = 'Old / closed'
        self.assertFalse(should_notify_12of12(ledger, 'GBP/JPY',
                                              full_alignment(stale)))
        self.assertEqual(ledger['GBP/JPY'], 'SELL')
        self.assertFalse(should_notify_12of12(ledger, 'GBP/JPY',
                                              full_alignment(make_timeframes('SELL'))))

if __name__=='__main__':
    unittest.main()

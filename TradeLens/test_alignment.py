"""Strict twelve-forecast agreement checks. Run with python -m unittest."""
import unittest
from scan import HORIZONS, TIMEFRAMES, full_alignment, telegram_alert_summary

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

if __name__=='__main__':
    unittest.main()

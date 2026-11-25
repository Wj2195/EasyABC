import unittest
from datetime import datetime, timezone

import requests

from experts import (parse_leaderboard, parse_profile, forex_pair, load_experts,
                     reference_estimate, with_estimates, LEADERBOARD)

NOW = datetime(2026, 11, 25, 2, tzinfo=timezone.utc).timestamp()
PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY']


def ranking(accounts=None):
    accounts = accounts or [('11', 'alice', 90), ('12', 'bob', 80), ('13', 'carol', 70), ('14', 'dave', 60)]
    rows = ''.join(f'''<tr><td><input data-oid="{i}" data-name="Account {i}" data-gain="{gain}"></td>
        <td></td><td><a id="system-name-{i}" href="https://www.myfxbook.com/members/{owner}/strategy/{i}">Account</a></td>
        <td>{gain}</td><td>12.5%</td></tr>''' for i, owner, gain in accounts)
    ad = '''<tr><td><input data-oid="99" data-name="Ad" data-gain="999999"></td><td class="ad-badge">AD</td></tr>'''
    return '<select id="accountTypeSelect"><option value="2" selected>Real</option></select><table id="systemsContTable">'+ad+rows+'</table>'


def trade(symbol='EURUSD', direction='Buy', identity='123', sl='1.08000', tp='1.12000'):
    return f'''<tr data-record="{identity}"><td class="symbol">{symbol}</td><td>{direction}</td><td>1.10000</td>
        <td><span class="slPrice" style="display:none">{sl}</span><span class="slPips">9999</span></td>
        <td><span class="tpPrice" style="display:none">{tp}</span><span class="tpPips">8888</span></td></tr>'''


def profile(rows=None, private=False, age='2 minutes ago', verified=True, real=True):
    content = '<div>Open trades are private. Unlock</div>' if private else '''<table id="tradingOpenTradesTable"><thead><tr>
        <th class="symbol">Symbol</th><th class="action">Action</th><th class="openPrice">Open Price</th>
        <th class="sl">SL (Pips)</th><th class="tp">TP (Pips)</th></tr></thead><tbody>'''+(trade() if rows is None else rows)+'</tbody></table>'
    return f'''<div class="portfolio-resolve-account-type">{'Real' if real else 'Demo'} (USD)</div>
        <div id="trackRecordDiv" class="checked"></div>
        <div id="tradingPrivilegesDiv" class="{'checked' if verified else 'unchecked'}"></div>
        <span id="lastUpdatedTime">{age}</span><div id="openTradesCont">{content}</div>'''


ACCOUNT = {'id': '11', 'rank': 1, 'owner': 'alice', 'name': 'Account', 'gain_pct': 90,
           'drawdown_pct': 12.5, 'profile_url': 'https://www.myfxbook.com/members/alice/strategy/11'}


class PublicExpertTests(unittest.TestCase):
    def parse(self, html):
        return parse_profile(html, ACCOUNT, PAIRS, NOW)

    def test_only_three_distinct_owners_in_reported_gain_order_and_no_ads(self):
        accounts = parse_leaderboard(ranking([('11', 'alice', 90), ('12', 'alice', 85),
                                             ('13', 'bob', 80), ('14', 'carol', 70)]))
        self.assertEqual([a['owner'] for a in accounts], ['alice', 'bob', 'carol'])
        self.assertEqual([a['rank'] for a in accounts], [1, 2, 3])

    def test_changed_layout_order_account_type_and_external_links_fail_closed(self):
        for html in ('<h1>Access denied</h1>', ranking().replace('value="2"', 'value="1"'),
                     ranking([('11', 'alice', 70), ('12', 'bob', 90)]),
                     ranking().replace('https://www.myfxbook.com/members/', 'https://bad.test/members/')):
            with self.subTest(html=html[:40]), self.assertRaises(ValueError):
                parse_leaderboard(html)

    def test_gold_all_aliases_and_other_assets_are_excluded(self):
        for symbol in ('XAUUSD', 'XAU/USD', 'XAUUSD.m', 'GOLD', 'GOLDpro', 'XAUEUR', 'XAGUSD', 'BTCUSD', 'US500'):
            self.assertIsNone(forex_pair(symbol, PAIRS))
        self.assertEqual(forex_pair('EURUSD.m', PAIRS), 'EUR/USD')
        data = self.parse(profile(rows=trade('XAUUSD')+trade(identity='124')))
        self.assertEqual([p['pair'] for p in data['positions']], ['EUR/USD'])
        self.assertEqual(data['excluded_non_forex'], 1)

    def test_explicit_tp_sl_prices_are_used_instead_of_pip_or_profit_spans(self):
        position = self.parse(profile())['positions'][0]
        self.assertEqual(position['take_profit'], 1.12)
        self.assertEqual(position['stop_loss'], 1.08)
        for value in ('-', '0', 'nan', 'inf'):
            position = self.parse(profile(rows=trade(sl=value, tp=value)))['positions'][0]
            self.assertIsNone(position['take_profit'])
            self.assertIsNone(position['stop_loss'])

    def test_private_stale_unverified_demo_or_missing_update_never_returns_positions(self):
        for kwargs in ({'private': True}, {'age': '31 minutes ago'}, {'age': 'Unknown'},
                       {'verified': False}, {'real': False}):
            self.assertEqual(self.parse(profile(**kwargs))['positions'], [])

    def test_pending_and_duplicate_records_are_not_new_live_positions(self):
        output = self.parse(profile(rows=trade()+trade()+trade(direction='Buy Limit', identity='125')))
        self.assertEqual(len(output['positions']), 1)
        self.assertEqual(output['rejected_rows'], 2)

    def test_empty_public_positions_are_distinct_from_private_positions(self):
        self.assertEqual(self.parse(profile(rows=''))['status'], 'No public forex positions')
        self.assertIn('private', self.parse(profile(private=True))['status'])

    def test_refresh_is_throttled_and_failed_fetch_does_not_republish_cached_positions(self):
        state, calls = {}, []
        def fetch(_, url):
            calls.append(url)
            return ranking() if url == LEADERBOARD else profile()
        data = load_experts(None, state, NOW, PAIRS, fetch)
        self.assertEqual(len(data['accounts']), 3)
        load_experts(None, state, NOW+60, PAIRS, fetch)
        self.assertEqual(len(calls), 4)
        def fail(*_):
            raise requests.Timeout()
        data = load_experts(None, state, NOW+901, PAIRS, fail)
        self.assertFalse(data['usable'])
        self.assertEqual(data['accounts'], [])

    def test_new_private_profile_clears_previously_public_trades(self):
        state = {}
        load_experts(None, state, NOW, PAIRS,
                     lambda _, url: ranking() if url == LEADERBOARD else profile())
        output = load_experts(None, state, NOW+901, PAIRS,
                              lambda _, url: ranking() if url == LEADERBOARD else profile(private=True))
        self.assertTrue(all(not a['positions'] for a in output['accounts']))

    def test_source_publication_time_expires_independently_of_http_check(self):
        state = {}
        load_experts(None, state, NOW, PAIRS,
                     lambda _, url: ranking() if url == LEADERBOARD else profile(age='29 minutes ago'))
        output = load_experts(None, state, NOW+121, PAIRS, lambda *_: self.fail('Should use cache'))
        self.assertTrue(output['usable'])
        self.assertTrue(all(not a['positions'] for a in output['accounts']))


class ReferenceLevelTests(unittest.TestCase):
    def rows(self, pair='EUR/USD'):
        return {pair: {'timeframes': {'1h': {'status': 'Updated', 'candle_epoch': NOW-3600,
            'candle_time': '2026-11-25T01:00:00Z', 'candles':
            [{'h': 1.11, 'l': 1.09, 'c': 1.10} for _ in range(60)]}}}}

    def test_buy_sell_and_jpy_levels_are_separate_from_expert_orders(self):
        for direction in ('BUY', 'SELL'):
            position = {'pair': 'EUR/USD', 'direction': direction, 'take_profit': 1.25, 'stop_loss': None}
            data = {'accounts': [{'positions': [position]}]}
            output = with_estimates(data, self.rows(), NOW)
            out = output['accounts'][0]['positions'][0]
            self.assertEqual(out['take_profit'], 1.25)
            self.assertIsNone(out['stop_loss'])
            self.assertEqual(out['estimate']['take_profit'], 1.16 if direction == 'BUY' else 1.04)
            self.assertEqual(out['estimate']['stop_loss'], 1.07 if direction == 'BUY' else 1.13)
            self.assertNotIn('estimate', position)

    def test_stale_or_missing_market_data_cannot_create_reference_levels(self):
        position = {'pair': 'EUR/USD', 'direction': 'BUY'}
        self.assertIsNone(reference_estimate(position, {}, NOW))
        self.assertIsNone(reference_estimate(position, self.rows(), NOW+7201))
        rows = self.rows();rows['EUR/USD']['timeframes']['1h']['candles'] = []
        self.assertIsNone(reference_estimate(position, rows, NOW))

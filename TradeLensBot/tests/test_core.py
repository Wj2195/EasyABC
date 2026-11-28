import copy
import json
from pathlib import Path
import tempfile
import unittest
from datetime import datetime, timezone

from core import (Journal, analyse, candidates, evaluate, fresh, news_gate,
                  paper_levels, paper_outcome, validate_review)

NOW = datetime(2026, 11, 25, 12, tzinfo=timezone.utc).timestamp()


def stamp(t):
    return datetime.fromtimestamp(t, timezone.utc).isoformat()


def snapshot(pair="EUR/USD"):
    frames = {}
    for tf, length in (("15m", 900), ("1h", 3600), ("1d", 86400)):
        start = NOW-length
        frames[tf] = {"status": "Updated", "candle_epoch": start, "candle_time": stamp(start),
                      "price": 1.1, "candles": [{"h": 1.11, "l": 1.09, "c": 1.1} for _ in range(60)],
                      "forecasts": {str(h): {"bias": "BUY", "up": 60, "down": 20, "sideways": 20}
                                    for h in (1, 3, 6, 12)}}
    return {"updated_at": stamp(NOW), "rows": {pair: {"timeframes": frames}},
            "news": {"usable": True, "checked_at": stamp(NOW), "events": []}}


class CoreTests(unittest.TestCase):
    def test_signal_is_recomputed_not_taken_from_eligibility_flag(self):
        data = snapshot()
        signal = candidates(data, NOW)[0]
        self.assertEqual(signal["agreement"], 12)
        self.assertEqual(signal["direction"], "BUY")
        data["rows"]["EUR/USD"]["timeframes"]["1d"]["forecasts"].pop("12")
        self.assertEqual(candidates(data, NOW), [])

    def test_gold_and_other_assets_are_never_candidates(self):
        for pair in ("XAU/USD", "GOLD", "XAUUSD.m", "BTC/USD"):
            self.assertEqual(candidates(snapshot(pair), NOW), [])

    def test_stale_snapshot_candles_and_daily_lag_are_blocked(self):
        data = snapshot()
        with self.assertRaises(ValueError):
            candidates(data, NOW+1801)
        for tf in ("15m", "1h", "1d"):
            old = copy.deepcopy(data)
            old["rows"]["EUR/USD"]["timeframes"][tf]["candle_epoch"] -= 86400 * 5
            self.assertEqual(candidates(old, NOW), [])

    def test_inconsistent_probabilities_or_bias_fail_closed(self):
        for change in ({"up": 500}, {"bias": "SELL"}, {"up": float("nan")}):
            data = snapshot()
            data["rows"]["EUR/USD"]["timeframes"]["1h"]["forecasts"]["1"].update(change)
            self.assertEqual(candidates(data, NOW), [])

    def test_signal_id_is_stable_until_candle_or_direction_changes(self):
        data = snapshot()
        first = candidates(data, NOW)[0]["id"]
        self.assertEqual(first, candidates(data, NOW+60)[0]["id"])
        data["rows"]["EUR/USD"]["timeframes"]["15m"]["candle_epoch"] += 900
        self.assertNotEqual(first, candidates(data, NOW+900)[0]["id"])

    def test_unknown_news_and_nearby_releases_block_paper_entry(self):
        data = snapshot()
        signal = candidates(data, NOW)[0]
        review = {"decision": "PASS", "score": 99, "reason": "Research only"}
        data["news"]["usable"] = False
        self.assertFalse(evaluate(data, signal, review, 85, NOW)[0])
        data = snapshot()
        data["news"]["events"] = [{"epoch": NOW+600, "pairs": ["EUR/USD"]}]
        self.assertFalse(evaluate(data, signal, review, 85, NOW)[0])

    def test_score_alone_is_not_sufficient_and_expiry_is_rechecked(self):
        data = snapshot()
        signal = candidates(data, NOW)[0]
        self.assertFalse(evaluate(data, signal, {"decision": "WAIT", "score": 99, "reason": "Sideways"}, 85, NOW)[0])
        self.assertFalse(evaluate(data, signal, {"decision": "PASS", "score": 84, "reason": "Weak"}, 85, NOW)[0])
        self.assertTrue(evaluate(data, signal, {"decision": "PASS", "score": 85, "reason": "Research only"}, 85, NOW)[0])
        self.assertFalse(evaluate(data, signal, {"decision": "PASS", "score": 99, "reason": "Old"}, 85, NOW+1801)[0])

    def test_malformed_ai_results_cannot_pass(self):
        for result in ({}, {"decision": "PASS", "score": True, "reason": "Bad"},
                       {"decision": "PASS", "score": float("nan"), "reason": "Bad"},
                       {"decision": "PASS", "score": 101, "reason": "Bad"},
                       {"decision": "BUY", "score": 90, "reason": "Bad"}):
            with self.assertRaises(ValueError):
                validate_review(result)

    def test_ai_only_receives_schema_and_data_and_never_tools(self):
        signal = candidates(snapshot(), NOW)[0]
        def request(url, payload, **kwargs):
            self.assertEqual(url, "http://127.0.0.1:11434/api/chat")
            self.assertFalse(payload["stream"])
            self.assertNotIn("tools", payload)
            return {"done": True, "message": {"content": json.dumps({"decision": "PASS", "score": 90, "reason": "Research only"})}}
        self.assertEqual(analyse(signal, "local-model", request)["score"], 90)

    def test_illustrative_levels_and_intrabar_ambiguity(self):
        data = snapshot()
        signal = candidates(data, NOW)[0]
        levels = paper_levels(data, signal, NOW)
        self.assertAlmostEqual(levels["tp"], 1.16)
        self.assertAlmostEqual(levels["sl"], 1.07)
        position = {**levels, "direction": "BUY"}
        self.assertIsNone(paper_outcome(position, [{"t": NOW-900, "h": 2, "l": .5}]))
        self.assertEqual(paper_outcome(position, [{"t": NOW+900, "h": 2, "l": .5}])[0], "AMBIGUOUS")
        self.assertEqual(paper_outcome(position, [{"t": NOW+900, "h": 1.2, "l": 1.09}])[0], "TP_TOUCHED")

    def test_journal_survives_restart_and_wait_is_not_an_open_position(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)/"journal.sqlite"
            signal = candidates(snapshot(), NOW)[0]
            journal = Journal(path)
            journal.save(signal, "WAIT", {"reason": "News"}, NOW)
            restarted = Journal(path)
            self.assertTrue(restarted.seen(signal["id"]))
            self.assertFalse(restarted.has_open("EUR/USD"))
            restarted.save(signal, "SIMULATED", {"levels": paper_levels(snapshot(), signal, NOW)}, NOW)
            self.assertTrue(Journal(path).has_open("EUR/USD"))

    def test_reconcile_ignores_forming_candles_and_records_completed_touch(self):
        with tempfile.TemporaryDirectory() as tmp:
            data = snapshot()
            signal = candidates(data, NOW)[0]
            journal = Journal(Path(tmp)/"journal.sqlite")
            journal.save(signal, "SIMULATED", {"levels": paper_levels(data, signal, NOW)}, NOW)
            data["rows"]["EUR/USD"]["timeframes"]["15m"]["candles"] = [{"t": NOW, "h": 2, "l": .5}]
            data["updated_at"] = stamp(NOW+600)
            self.assertEqual(journal.reconcile(data, NOW+600), [])
            data["updated_at"] = stamp(NOW+900)
            self.assertEqual(journal.reconcile(data, NOW+900), ["EUR/USD AMBIGUOUS"])
            self.assertFalse(journal.has_open("EUR/USD"))


if __name__ == "__main__":
    unittest.main()

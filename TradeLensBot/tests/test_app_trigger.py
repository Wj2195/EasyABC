import json
from pathlib import Path
import queue
import tempfile
import threading
import unittest
from unittest.mock import patch

try:
    import app
except ImportError:
    app = None

from core import Journal
from codex_bridge import CodexError
from test_core import NOW, snapshot


@unittest.skipIf(app is None, "tkinter unavailable on this platform")
class AppTriggerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.home = Path(self.tmp.name)
        self.desk = app.App.__new__(app.App)
        self.desk.stop = threading.Event()
        self.desk.stop.clear()
        self.desk.cancel_analysis = threading.Event()
        self.desk.events = queue.Queue()
        self.desk.closing = False
        self.desk.journal = Journal(self.home / "journal.sqlite")

    def tearDown(self):
        self.tmp.cleanup()

    def test_new_signal_triggers_codex_once_and_exports_analysis_without_orders(self):
        with patch.object(app, "HOME", self.home), patch.object(app.time, "time", return_value=NOW), \
             patch.object(app, "fetch_snapshot", return_value=snapshot()), \
             patch.object(app, "analyse_codex", return_value={"decision":"PASS","score":90,"reason":"Fixture only"}) as codex, \
             patch.object(app, "analyse") as ollama:
            self.desk.work("", 85, False, "Codex CLI", "")
            self.desk.work("", 85, False, "Codex CLI", "")
            self.assertEqual(codex.call_count, 1)
            ollama.assert_not_called()
        records = self.desk.journal.records()
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["status"], "READY")
        exports = list((self.home / "analysis-outbox").glob("*.json"))
        self.assertEqual(len(exports), 1)
        self.assertFalse(json.loads(exports[0].read_text())["execution_authorized"])

    def test_expiry_during_codex_review_is_saved_as_wait(self):
        now = [NOW]
        def review(*_):
            now[0] += 1801
            return {"decision":"PASS","score":99,"reason":"Fixture only"}
        with patch.object(app, "HOME", self.home), patch.object(app.time, "time", side_effect=lambda:now[0]), \
             patch.object(app, "fetch_snapshot", return_value=snapshot()), patch.object(app, "analyse_codex", side_effect=review):
            self.desk.work("", 85, False)
        self.assertEqual(self.desk.journal.records()[0]["status"], "WAIT")

    def test_cli_error_pauses_monitoring_without_an_ollama_fallback(self):
        with patch.object(app, "HOME", self.home), patch.object(app.time, "time", return_value=NOW), \
             patch.object(app, "fetch_snapshot", return_value=snapshot()), \
             patch.object(app, "analyse_codex", side_effect=CodexError("Fixture usage limit")), \
             patch.object(app, "analyse") as ollama:
            self.desk.work("", 85, False)
            ollama.assert_not_called()
        self.assertTrue(self.desk.stop.is_set())
        self.assertEqual(self.desk.journal.records(), [])

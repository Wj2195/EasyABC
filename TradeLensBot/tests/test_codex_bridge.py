import json
from pathlib import Path
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

import codex_bridge as bridge
from analysis_export import export_analysis
from test_core import NOW, candidates, snapshot


FAKE_CLI = r'''
import json, pathlib, sys, time
args = sys.argv[1:]
if '--version' in args:
    print('codex test transport fixture');sys.exit(0)
if '--help' in args:
    print('--ignore-user-config --output-schema --output-last-message --ephemeral');sys.exit(0)
if args[:2] == ['login', 'status']:
    print('Sensitive account detail which must not be displayed');sys.exit(0)
prompt = sys.stdin.read()
assert args[0] == 'exec'
assert args[args.index('--sandbox')+1] == 'read-only'
assert '--ignore-user-config' in args and '--ephemeral' in args
assert args[-1] == '-'
assert 'SIGNAL_DATA_BEGIN' in prompt and 'Do not place trades' in prompt
if 'SLOW_FIXTURE' in prompt:
    time.sleep(10)
if 'NONZERO_FIXTURE' in prompt:
    print('Fixture sensitive diagnostic', file=sys.stderr);sys.exit(7)
result = pathlib.Path(args[args.index('--output-last-message')+1])
if 'MISSING_FIXTURE' in prompt:
    sys.exit(0)
if 'INVALID_FIXTURE' in prompt:
    result.write_text('not json');sys.exit(0)
if 'OVERSIZE_FIXTURE' in prompt:
    result.write_text('X'*33000);sys.exit(0)
result.write_text(json.dumps({'decision':'WAIT','score':42,'reason':'Transport fixture, not real model analysis.'}))
'''


class CodexBridgeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.script = Path(self.tmp.name) / 'fake codex.py'
        self.script.write_text(FAKE_CLI)
        self.command = [sys.executable, str(self.script)]
        self.signal = candidates(snapshot(), NOW)[0]
        self.resolver = patch.object(bridge, 'resolve_codex', return_value=self.command)
        self.resolver.start()

    def tearDown(self):
        self.resolver.stop()
        self.tmp.cleanup()

    def test_real_subprocess_transport_passes_prompt_on_stdin_and_reads_schema_result(self):
        self.signal['untrusted_note'] = 'Words with & | $(commands) and quotation marks " not a shell command'
        result = bridge.analyse_codex(self.signal)
        self.assertEqual(result['decision'], 'WAIT')
        self.assertEqual(result['score'], 42)

    def test_diagnostic_does_not_display_login_details(self):
        status = bridge.check_codex()
        self.assertIn('signed in', status)
        self.assertNotIn('Sensitive', status)

    def test_nonzero_exit_is_not_accepted_and_diagnostics_are_not_exposed(self):
        self.signal['fixture'] = 'NONZERO_FIXTURE'
        with self.assertRaises(bridge.CodexError) as caught:
            bridge.analyse_codex(self.signal)
        self.assertNotIn('sensitive diagnostic', str(caught.exception))

    def test_invalid_missing_and_oversized_results_fail_closed(self):
        for marker in ('INVALID_FIXTURE', 'MISSING_FIXTURE', 'OVERSIZE_FIXTURE'):
            with self.subTest(marker=marker), self.assertRaises(bridge.CodexError):
                bridge.analyse_codex({**self.signal, 'fixture': marker})

    def test_timeout_stops_owned_child(self):
        start = time.monotonic()
        with self.assertRaises(bridge.CodexError):
            bridge.analyse_codex({**self.signal, 'fixture': 'SLOW_FIXTURE'}, timeout=.4)
        self.assertLess(time.monotonic()-start, 8)

    def test_cancel_stops_active_child_and_discards_result(self):
        event = threading.Event()
        timer = threading.Timer(.4, event.set)
        timer.start()
        try:
            with self.assertRaises(bridge.AnalysisCancelled):
                bridge.analyse_codex({**self.signal, 'fixture': 'SLOW_FIXTURE'}, cancel=event)
        finally:
            timer.cancel()

    def test_cancelled_before_start_never_launches_cli(self):
        event = threading.Event();event.set()
        with patch.object(bridge.subprocess, 'Popen') as launch:
            with self.assertRaises(bridge.AnalysisCancelled):
                bridge.analyse_codex(self.signal, cancel=event)
            launch.assert_not_called()


class ResolutionAndExportTests(unittest.TestCase):
    def test_missing_cli_explains_setup_without_falling_back_to_shell(self):
        with patch.object(bridge.shutil, 'which', return_value=None):
            with self.assertRaises(bridge.CodexError):
                bridge.resolve_codex()

    def test_windows_npm_shim_uses_node_not_command_shell(self):
        with tempfile.TemporaryDirectory() as tmp:
            shim = Path(tmp)/'codex.cmd';shim.write_text('not executed')
            entry = Path(tmp)/'node_modules'/'@openai'/'codex'/'bin'/'codex.js'
            entry.parent.mkdir(parents=True);entry.write_text('// fixture')
            with patch.object(bridge.shutil, 'which', return_value='node.exe'):
                command = bridge.resolve_codex(str(shim))
            self.assertEqual(command[0], 'node.exe')
            self.assertTrue(Path(command[1]).samefile(entry))

    def test_analysis_export_is_atomic_not_an_order_and_keeps_signal_identity(self):
        signal = candidates(snapshot(), NOW)[0]
        with tempfile.TemporaryDirectory() as tmp:
            result = export_analysis(tmp, signal, {'review': {'decision':'WAIT','score':42,'reason':'Fixture'}}, 'WAIT', 'Codex CLI', NOW)
            data = json.loads(result.read_text())
            self.assertEqual(data['kind'], 'tradelens_analysis')
            self.assertFalse(data['execution_authorized'])
            self.assertEqual(data['signal_id'], signal['id'])
            self.assertEqual(list(result.parent.glob('*.tmp')), [])
            with self.assertRaises(ValueError):
                export_analysis(tmp, {**signal, 'id':'../escape'}, {}, 'WAIT', 'Codex CLI', NOW)

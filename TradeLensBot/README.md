# TradeLens AI Desk 0.2 — Codex analysis trigger

Independent desktop software which reads the existing public TradeLens snapshot,
starts a separate Codex CLI review for eligible signals, notifies you inside the app,
and optionally records simulated entries when all checks pass.

**XM execution is not connected. This version never signs in, submits real/demo
broker orders, or accesses an XM password.** The user uses XM's own app; a supported
XM execution interface/account platform has not yet been confirmed. This is a
working research core, not a completed live XM auto-trader.

## Windows app

Download the TradeLensAI-Windows artifact from the successful **Build TradeLens AI Desk**
GitHub Actions run for this branch. Unzip it, then run TradeLensAI.exe.

The executable is unsigned. You can inspect and build the source yourself instead.
No broker credentials are requested. No real order-submission library is included.
Codex CLI must already be installed and signed in on this Windows PC. No local model or
Ollama installation is required for the Codex provider. Ollama models are installed
separately only if you choose that optional provider.

## Connect your installed, signed-in Codex CLI

1. Unzip the Windows artifact and run TradeLensAI.exe on the same PC as Codex CLI.
2. Leave **Analysis provider** set to **Codex CLI**.
3. Leave **Model** blank to use Codex's built-in default, or select a supported model explicitly.
4. Leave **Codex executable** blank for automatic discovery. If not found, enter the full path to
   codex.exe or the npm codex.cmd installation entrypoint. Node is required for the npm installation.
   A CLI installed only inside WSL is not automatically discovered by this native Windows build.
5. Click **Check connection**. It checks the CLI version, required exec flags, and login status,
   without running a paid model request or displaying authentication details.
6. Click **Check now** to review up to three new eligible signals, or **Start monitoring** to watch
   every 60 seconds while this PC and app remain running. Repeated signals on the same candles
   are skipped using the existing journal.
7. Read the review in the app. Results are also saved as JSON under
   %LOCALAPPDATA%\TradeLensAI\analysis-outbox. Each file includes signal identity, pair, direction,
   snapshot time, analysis completion time, provider, status, score/reason, and execution_authorized=false.

**This triggers a new non-interactive Codex CLI job, not a prompt in an existing ChatGPT conversation.**
Telegram forwarding and an OpenAI API key are not required when your CLI already uses a signed-in
ChatGPT account. The bridge uses the CLI's existing authentication; plan limits and any billing
associated with that login still apply. The app does not create an API account, sign you in,
change credentials or promise unlimited/free model usage.

Current Codex CLI support is required for --ignore-user-config, --ephemeral, --output-schema and
--output-last-message. Check connection explains if an update is needed. No permissive fallback
is attempted for older CLIs. The app ignores user CLI tool configuration for the review, uses an
empty temporary working directory, selects the read-only sandbox, disables shell/apps/browser/
computer-use features and web search, and passes the signal through stdin with no command shell.
It does not use approval/sandbox bypass flags. An explicit model field can override the built-in
model default; other personal CLI configuration is intentionally not loaded. CLI authentication
still uses its normal credential store.

The expected result is a validated object containing decision (PASS or WAIT), score (0–100),
and reason. PASS is an analysis label, not an order authorization. Missing, malformed, oversized,
failed, cancelled or timed-out responses are rejected. A Codex error pauses monitoring rather
than repeatedly consuming usage or silently falling back to another model. Restart after checking
the CLI connection. Stop cancels an active Codex child process and its process group/tree.

Optional **Ollama** support is retained. Install it from https://ollama.com/download/windows,
download a local model appropriate for your PC, select Ollama in the provider field and choose
an installed model. Ollama calls use its local http://127.0.0.1:11434 API. The model is not bundled.

## Research behavior

- Pulls TradeLens every 60 seconds while monitoring and the PC/app remain running.
  It does not require Telegram. Your existing Telegram notifications are unaffected.
- Analyses up to three new signals per cycle. Recomputes the 10/12 rule and checks
  all twelve forecasts on fresh completed 15m/1h/daily candles.
- Excludes Gold/XAU and all symbols outside TradeLens's forex allowlist.
- A snapshot over 30 minutes old, missing/stale news coverage, or a listed release
  within the next hour / previous half-hour prevents a simulated entry.
- Rechecks freshness after the AI returns. The model's PASS and score must both
  pass the configured threshold; malformed responses fail closed.
- An AI score is a heuristic review score, not a probability of profit.
- Simulated TP/SL use hourly Wilder ATR(14): TP 3 ATR / SL 1.5 ATR from the latest
  completed 15m price. These are illustrative research levels, not expert orders.
- Journal persists by signal/candle ID and suppresses repeated analysis of the
  same signal. One simulated open position per pair. An AI failure can retry later.
- TP/SL observations use completed candles beginning after the simulated entry.
  If both levels occur in one candle, outcome is AMBIGUOUS, never assumed profitable.
- No cash profit, lot sizing, margin, broker fills, spreads, commissions, slippage,
  tick sequencing, or continuous price-path coverage is simulated. Gaps in the
  scanner feed can miss outcomes. Results are not a strategy backtest/win rate.
- Stop prevents new automatic simulated entries. Codex jobs are cancelled when Stop is pressed; a pending Ollama request may finish, but its
  result is discarded after cancellation. Neither provider contacts a broker.

Settings and SQLite journal are stored in %LOCALAPPDATA%\TradeLensAI, independently
of the public website. The app needs internet for TradeLens, and Codex CLI sends review requests using its configured OpenAI authentication. Ollama is the optional local-model provider.
XM integration needs a supported execution route; browser/mobile-app credentials
alone do not establish one. Confirm the platform/server shown in XM account details
or the official integration interface with XM before adding an order connector.

## Run from source / build

Python 3.11+ for Windows with tkinter:

    python TradeLensBot/app.py

Tests:

    python -m unittest discover -s TradeLensBot/tests -v

Set PYTHONPATH=TradeLensBot before running tests.

Build from the repository root:

    python -m pip install "pyinstaller>=6,<7"
    python -m PyInstaller --noconfirm --clean --onefile --windowed --name TradeLensAI --paths TradeLensBot TradeLensBot/app.py

## References

- Codex non-interactive mode: https://developers.openai.com/codex/noninteractive
- Codex CLI reference: https://developers.openai.com/codex/cli/reference

- Ollama chat / structured output:
  https://docs.ollama.com/api/chat
  https://docs.ollama.com/capabilities/structured-outputs
- Ollama Windows: https://docs.ollama.com/windows
- XM's documented MT5 / Expert Advisor route: https://www.xm.com/mt5

The XM connector is deliberately not assumed to work with the XM App.

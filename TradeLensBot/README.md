# TradeLens AI Desk 0.1 — Windows desktop app

Independent desktop software which reads the existing public TradeLens snapshot,
asks a local AI model to review eligible signals, notifies you inside the app,
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
The AI model is not bundled and must be installed separately.

## Local AI setup (no OpenAI API key required)

1. Install Ollama from https://ollama.com/download/windows.
2. Download a local model appropriate for your PC in Ollama. Model quality and
   hardware requirements vary; the app makes no model-performance claims.
3. Start this app and click **Refresh models**. Select an installed model.
4. Set your review threshold (default 85 is illustrative, not a tested optimum).
5. Click **Check now** to analyse the latest eligible signals.
6. To monitor continuously, click **Start monitoring**.
7. Optionally enable automatic simulated entries. This only writes the local journal.

Ollama runs locally at http://127.0.0.1:11434. The app sends only bounded signal
data to its chat API with a JSON schema, never browser cookies, broker credentials,
tool calls, shell commands, or executable AI-generated code.

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
- Stop prevents new automatic simulated entries. A pending local AI request may
  finish and record an analysis, but does not contact a broker.

Settings and SQLite journal are stored in %LOCALAPPDATA%\TradeLensAI, independently
of the public website. The app needs internet for TradeLens, but AI runs locally.
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

- Ollama chat / structured output:
  https://docs.ollama.com/api/chat
  https://docs.ollama.com/capabilities/structured-outputs
- Ollama Windows: https://docs.ollama.com/windows
- XM's documented MT5 / Expert Advisor route: https://www.xm.com/mt5

The XM connector is deliberately not assumed to work with the XM App.

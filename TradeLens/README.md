# TradeLens 1.6.0

Telegram technical alerts require **at least 10 of 12** forecasts to agree:
10/12, 11/12 or 12/12. Nine or fewer does not qualify. All twelve forecasts
across 15m, 1h, 1D and 1/3/6/12-bar horizons must exist on fresh completed
candles. A tied forecast counts as no directional vote; the denominator stays
12. Missing or stale forecasts block alerts. Strength is diagnostic only,
preserving the chosen direction-based rule.

Messages use `USDJPY - BUY (10/12)`, one line per pair, grouped into one message.
An unchanged qualifying direction is eligible again **15 minutes after its
last successful delivery**. Fresh data is fetched and agreement rechecked before
every reminder. Below 10/12, missing or stale data suppresses the reminder;
if the pair later qualifies again, the same delivery timer applies. A newly
confirmed opposite direction can alert immediately. Score changes between
10, 11 and 12 do not bypass the timer. A failed delivery does not advance it.

The delivery ledger persists the direction and successful-send timestamp for
each pair across runs. Previous 12/12 and consensus delivery timestamps are
imported from history; older permanent direction latches no longer suppress
reminders. All 28 pairs are scanned each cycle, replacing rotating batches so
qualifying pairs can be rechecked each run. Reminders occur on the first
successful qualifying scan after the 15-minute interval, not at a guaranteed
exact clock time. Missed intervals never cause a burst of catch-up messages.

## Scheduled news

The [Forex Factory calendar](https://www.forexfactory.com/calendar) links its
[weekly JSON export](https://nfs.faireconomy.media/ff_calendar_thisweek.json).
The scanner checks this feed at most hourly, validates offset-bearing times,
converts display times to Asia/Kuala_Lumpur, and maps Medium and High impact events to
every supported pair containing that currency (or all pairs for ALL).

One warning per event is sent on the first successful scan in the 60 minutes
before its scheduled time. Each warning is labelled MEDIUM or HIGH and shows
the release time in Malaysia and affected pairs. Low-impact events are excluded.
At or after release, the event is skipped, including when feed retrieval delays
the scan. News alerts do not repeat every 15 minutes. Existing high-impact
delivery records survive this upgrade; the calendar refreshes immediately to
include medium-impact events. This is independent of technical alignment and the
technical market-data scan. Rescheduled times form a new event identity.
Failures retain a visibly labelled cache for at most three hours; an expired,
invalid or previous-week feed means unknown news risk, not no risk. Invalid
medium/high-impact records are skipped and reported. Cancelled/removed events are
removed on the next successful feed refresh. Feed times and impact labels are
provider estimates; tentative times cannot reliably be identified in this feed.
Warnings do not claim a BUY/SELL effect, actual release outcome, or guaranteed
large move. Indirect effects on other currencies and surprise breaking news are
not covered. The feed covers only the current provider week, not a full rolling
seven-day calendar. At a week boundary, next-week events become available only
when the provider updates its feed.

The GitHub workflow requests a scan every five minutes, away from the top of
the hour, increasing recovery opportunities after a dropped invocation. The
15-minute successful-delivery cooldown is unchanged. Changing the cron also
re-registers its schedule actor. Runs can still be
[delayed or dropped](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
No exact advance-warning time or continuous news coverage is guaranteed. Strict
timing requires an independent scheduler/always-on worker; a cron change alone
cannot guarantee it. The scanner publishes its previous scan gap and current
coverage. A gap over 30 minutes is reported even after data recovers.

When the current calendar still contains an event whose release passed since
the previous scan without a recorded delivery, it is stored in a separate
missed-warning audit (when Telegram/news alerts are enabled and configured).
This audit never sends an overdue warning or consumes a delivery timer.
Cancelled/removed events, expired feeds, and prior-week events cannot be
reliably reconstructed, so this is a record of known gaps, not proof of full coverage.

## Analysis quality

The nine-feature analog model is unchanged mathematically. Vectorization makes
its historical checks practical. The 15m freshness limit is now 30 minutes after
candle close (previously two hours); 1h remains two hours. Daily freshness now
requires the latest completed weekday bar, with a two-hour publication grace
after UTC midnight and a one-hour provider/DST timestamp tolerance. Friday's
bar remains valid over the weekend and on Monday; Thursday's bar cannot pass
as Friday's. Holiday gaps are treated as unavailable rather than guessed.
The scanner rechecks rows before notification and the browser uses the same policy.

The dashboard expires a snapshot after 30 minutes, hides expired forecast
scores, labels historical charts, and shows current pair coverage and refresh
failures. A 30-second render timer expires data even if a request stalls; fetches
time out after 15 seconds. Forecast matrices show the highest-scoring outcome,
including SIDEWAYS; low-strength consensus has a visible label. These diagnostics
do not change the user's directional 10/12 rule or Telegram message format.

Each scanned timeframe/horizon includes up to 40 historical walk-forward tests.
Every training label ends strictly before the test forecast origin. Outcomes
do not overlap within that timeframe/horizon. Features are causal. Directional
hits, significant-move hits (0.35 × sqrt(horizon) × ATR), and a causal momentum
baseline are reported with sample counts. Ties are excluded from forecast tests
and count as misses for the momentum baseline. No accuracy filter has been
silently added to the user's alert rule.

These small samples diagnose **individual forecasts**, not the combined 10/12-or-higher
strategy. There is no validated win rate and no deduction for spread,
slippage or fees, nor any stop-loss/take-profit simulation. The 12 outputs are
correlated. Agreement is not confidence or a measured probability of profit.
Relaxing the threshold increases eligible signals; improved precision has not
been demonstrated. A strategy-level historical replay with synchronized
timeframes and broker costs is needed before changing model weights or
claiming better trade precision. [Time-series evaluation reference](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html).

Run tests: `PYTHONPATH=TradeLens python -m unittest discover -s TradeLens -p 'test_*.py'`

Dashboard checks: `node --test TradeLens/test_dashboard.cjs`

## Expert trade watch (read only, Gold excluded)

The scanner reads [Myfxbook's public real-account leaderboard](https://www.myfxbook.com/systems/1)
and watches its top three distinct account owners by **reported total gain**.
Sponsored rows and duplicate owners are excluded; the leaderboard must be
gain-sorted and filtered to real accounts or the adapter fails closed. This is
a ranking within the provider's public list, not a worldwide ranking or a
risk-adjusted recommendation. Account gains are full-account statistics and
may include Gold or other assets; filtering positions cannot reconstruct
forex-only returns. Drawdown and source links are shown alongside gain.

Only the public `Open Trades` table is read. Positions require both track-record
and trading-privileges verification plus a real account. Private, missing or
unverified positions are labelled and never reconstructed from history or
forecasts. [Myfxbook verification](https://www.myfxbook.com/help/knowledge-base/verification/)
confirms reported history/privileges, not future performance or professional
qualifications. Their API is for personal account information, so this feature
does not ask for credentials or pretend it grants access to others' private trades.

Source requests are throttled to once per 15 minutes, with 15-second request
timeouts. HTTP and broker publication timestamps are separate. Public snapshots
expire after 30 minutes; relative provider update times are approximate, and
unrecognised dates fail closed. A failed refresh suppresses cached positions.
Privacy changes clear previously visible positions on the next successful
refresh. HTML/layout changes or access blocks produce an unavailable state;
there is no paywall/login workaround. The underlying site can delay publication,
so even a current public position is not a streaming broker feed.

The forex allowlist is the existing 28 pairs. Gold/XAU (including broker suffixes),
other metals, indices and crypto cannot be displayed. Pending orders are not
mislabelled as executed positions. Expert TP/SL use explicit price spans only:
pips, profit values, zeroes and undisclosed values are never substituted.

The separate **illustrative TP/SL** column uses fresh completed 1h candles and
Wilder ATR(14): TP is 3 ATR from the latest close and SL is 1.5 ATR in the opposite
direction. These are TradeLens-generated reference levels, not expert orders or
profit forecasts. They use the current candle close rather than the expert's
historical entry, ignore spread/costs, and expire with the price data. Published
expert levels are retained unchanged. [ATR definition](https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/atr).

Expert data is stored in the snapshot under `experts`; refresh state is under
`expert_watch`. Fetching occurs after existing Telegram delivery decisions.
It does not change technical consensus, send expert-trade notifications or
execute/copy orders. Set `enable_expert_watch: false` in `config.json` to disable it.

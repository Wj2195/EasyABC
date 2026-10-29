# TradeLens 1.5.1

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
converts display times to Asia/Kuala_Lumpur, and maps High impact events to
every supported pair containing that currency (or all pairs for ALL).

One warning per event is sent on the first successful scan in the 60 minutes
before its scheduled time. This is independent of technical alignment and the
technical market-data scan. Rescheduled times form a new event identity.
Failures retain a visibly labelled cache for at most three hours; an expired,
invalid or previous-week feed means unknown news risk, not no risk. Invalid
high-impact records are skipped and reported. Cancelled/removed events are
removed on the next successful feed refresh. Feed times and impact labels are
provider estimates; tentative times cannot reliably be identified in this feed.
Warnings do not claim a BUY/SELL effect, actual release outcome, or guaranteed
large move. Indirect effects on other currencies and surprise breaking news are
not covered. The feed covers only the current provider week, not a full rolling
seven-day calendar. At a week boundary, next-week events become available only
when the provider updates its feed.

The existing 15-minute GitHub workflow remains the scheduler. Runs can be
[delayed or dropped](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
No exact advance-warning time or continuous news coverage is guaranteed.

## Analysis quality

The nine-feature analog model is unchanged mathematically. Vectorization makes
its historical checks practical. The 15m freshness limit is now 30 minutes after
candle close (previously two hours); 1h remains two hours and daily four days.
The scanner rechecks rows before notification and the browser expires old eligibility too.

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

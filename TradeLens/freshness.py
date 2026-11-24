"""Completed-candle freshness policy shared with the dashboard's UTC checks."""
import math
from datetime import datetime, timedelta, timezone

SECS = {'15m': 900, '1h': 3600, '1d': 86400}
SNAPSHOT_MAX_AGE = 1800


def latest_daily_start(now):
    # Allow two hours for Yahoo to publish the preceding weekday's daily bar.
    # Weekend dates never require a Saturday/Sunday candle. The one-hour
    # timestamp tolerance in is_fresh accommodates the provider's DST shift.
    day = (datetime.fromtimestamp(now - 7200, timezone.utc)
           .replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1))
    while day.weekday() >= 5:
        day -= timedelta(days=1)
    return day.timestamp()


def is_fresh(start_epoch, tf, now):
    try:
        start = float(start_epoch)
        if not math.isfinite(start) or tf not in SECS:
            return False
        age = now - start - SECS[tf]
        if age < -60:
            return False
        if tf == '1d':
            return age <= 4 * 86400 and start >= latest_daily_start(now) - 3600
        return age <= 2 * SECS[tf]
    except (TypeError, ValueError, OverflowError):
        return False

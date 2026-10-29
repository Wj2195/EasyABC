"""Causal walk-forward diagnostics; not a backtest of the 10/12-or-higher alert strategy."""
import math


def walk_forward(model, candles, horizon, predict, max_samples=40):
    close, atr, _ = model
    # Each training label ends strictly before its forecast origin. Test
    # outcomes do not overlap within a timeframe/horizon evaluation.
    earliest = 200 + 46 * horizon
    origins = list(range(len(close) - 1 - horizon, earliest - 1, -horizon))[:max_samples]
    hits = significant = baseline_hits = 0
    sides = {'BUY': {'samples': 0, 'hits': 0}, 'SELL': {'samples': 0, 'hits': 0}}
    used = []
    for origin in reversed(origins):
        try:
            result = predict(model, horizon, origin=origin)
        except ValueError:
            continue
        bias = result['bias']
        if bias not in sides:
            continue
        change = float(close[origin + horizon] - close[origin])
        direction = 1 if bias == 'BUY' else -1
        correct = direction * change > 0
        hits += int(correct)
        significant += int(direction * change > .35 * math.sqrt(horizon) * atr[origin])
        momentum = close[origin] - close[origin - horizon]
        baseline_hits += int(momentum * change > 0)
        sides[bias]['samples'] += 1
        sides[bias]['hits'] += int(correct)
        used.append(origin)
    count = len(used)
    return {'samples': count, 'direction_hits': hits,
            'direction_hit_rate': round(100 * hits / count, 1) if count else None,
            'significant_move_hit_rate': round(100 * significant / count, 1) if count else None,
            'momentum_baseline_hit_rate': round(100 * baseline_hits / count, 1) if count else None,
            'by_direction': sides, 'small_sample': count < 100,
            'first_origin': candles[used[0]]['t'] if used else None,
            'last_outcome': candles[used[-1] + horizon]['t'] if used else None,
            'method': 'Walk-forward; known past labels only; non-overlapping outcomes per TF/horizon',
            'scope': 'Individual forecasts, not consensus alerts. No spread, fees, slippage, stop-loss or take-profit.'}

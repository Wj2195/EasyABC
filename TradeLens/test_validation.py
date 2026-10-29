import math
import unittest

import numpy as np

from scan import forecast, model_features, is_fresh
from validation import walk_forward


def candles(n=1200):
    rng = np.random.default_rng(927)
    close = 1.1 + np.cumsum(rng.normal(0, .001, n))
    return [{'t': 1700000000+i*900, 'o': float(c), 'h': float(c+.001),
             'l': float(c-.001), 'c': float(c)} for i, c in enumerate(close)]


class ValidationTests(unittest.TestCase):
    def test_vectorization_preserves_original_forecast(self):
        model = model_features(candles())
        close, atr, features = model
        last = len(close)-1
        for h in (1, 3, 6, 12):
            samples, counts = [], [0, 0, 0]
            for i in range(last-h-1, 198, -h):
                move = (close[i+h]-close[i])/atr[i]
                boundary = .35*math.sqrt(h)
                label = 2 if move > boundary else 0 if move < -boundary else 1
                counts[label] += 1
                samples.append((float(np.sum((features[last]-features[i])**2)), label))
            k = min(50, max(20, math.isqrt(len(samples))*3))
            probs = [8*(n+1)/(len(samples)+3) for n in counts]
            for _, label in sorted(samples)[:k]:
                probs[label] += 1
            actual = forecast(model, h)
            for field, p in zip(('down', 'sideways', 'up'), probs):
                self.assertEqual(actual[field], round(100*p/(k+8), 3))

    def test_future_prices_cannot_change_past_forecast(self):
        history = candles()
        origin = 900
        before = model_features(history)
        altered = [dict(c) for c in history]
        for c in altered[origin+1:]:
            for key in ('o', 'h', 'l', 'c'):
                c[key] *= 3
        after = model_features(altered)
        for h in (1, 3, 6, 12):
            self.assertEqual(forecast(before, h, origin), forecast(after, h, origin))

    def test_walk_forward_excludes_incomplete_outcomes(self):
        history = candles(1500)
        origins = []
        def predict(model, h, origin):
            origins.append(origin)
            return forecast(model, h, origin)
        out = walk_forward(model_features(history), history, 12, predict)
        self.assertEqual(out['samples'], 40)
        self.assertTrue(all(b-a >= 12 for a, b in zip(origins, origins[1:])))
        self.assertTrue(all(o+12 < len(history) for o in origins))
        self.assertTrue(out['small_sample'])
        self.assertEqual(sum(v['samples'] for v in out['by_direction'].values()), out['samples'])

    def test_fifteen_minute_candles_expire_after_two_bars(self):
        start = 1700000000
        self.assertTrue(is_fresh(start, '15m', start+900+1800))
        self.assertFalse(is_fresh(start, '15m', start+900+1801))
        self.assertFalse(is_fresh(start, '15m', start-900))

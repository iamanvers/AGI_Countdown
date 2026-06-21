# ADR-0002 — Hybrid clock engine (anchor + live factors)

- **Status:** Accepted
- **Date:** 2026-06-21
- **Related:** [02-CLOCK-ENGINE](../02-CLOCK-ENGINE.md), [ADR-0005](0005-determinism-boundary.md)

## Context

The headline output is a projected AGI date. Three broad approaches were on the table:

1. **Forecast aggregator only** — blend Metaculus/Manifold/expert surveys into a consensus date.
   Credible and defensible, but derivative — a dashboard, not a "custom engine."
2. **Original weighted-factor model only** — our own opinionated scoring of internal/external
   signals → date. Original and matches the "custom clock engine" vision, but hard to defend as
   "legit" with no external grounding.
3. **Hybrid** — a forecast-consensus **anchor** shifted by a live **weighted factor model**.

## Decision

Adopt the **hybrid**:

```
T_AGI(t) = Anchor(t) + Δ_factors(t)        // Δ bounded and EWMA-smoothed
```

`Anchor` grounds the estimate in the best available external forecasts; `Δ_factors` adds our
original, live, transparent reading of momentum — but is **bounded** (`±MAX_SHIFT`) so it can shape,
not fabricate, the date.

## Consequences

- Best of both: credible baseline **and** an original, live, opinionated model.
- The live model is explainable ("top movers") and bounded, limiting damage from bad data.
- More moving parts than a pure aggregator (two subsystems to calibrate and test) — mitigated by the
  factor registry being config and by backtesting ([14-TESTING](../14-TESTING.md)).

## Alternatives considered

- **Aggregator only** — rejected: not a "custom engine"; little originality.
- **Factor model only** — rejected: hard to defend as legitimate without an external anchor; prone
  to drifting away from reality.

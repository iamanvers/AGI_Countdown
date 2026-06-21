# 14 — Testing & Verification

The system mixes a **deterministic core** (easy to test rigorously) with a **non-deterministic
fleet** (tested via fixtures and contracts) and a **performance-critical frontend** (tested via
budgets). Each gets the right kind of test.

## Test pyramid

```
            ┌───────────────────────────────┐
            │ E2E: refresh → write JSON →    │   few, high-value
            │       render                   │
            ├───────────────────────────────┤
            │ Pipeline + connector contract  │
            ├───────────────────────────────┤
            │ Validator fixtures · backtests │
            ├───────────────────────────────┤
            │  Engine unit tests (most)      │   many, fast, deterministic
            └───────────────────────────────┘
```

## Engine unit tests (the bedrock)

`packages/engine` is pure functions → exhaustively unit-tested:

- **Anchor blend**: given fixed source distributions, the mixture median and spread are exactly as
  expected.
- **`Δ_factors`**: sign conventions (accelerator pulls sooner, decelerator pushes later); weight
  arithmetic; **`clamp` to `±MAX_SHIFT`**; EWMA smoothing behavior.
- **`progress%`**: basket weighting per definition sums and maps correctly to 0–100.
- **`confidenceBand`**: widens with disagreement/volatility, narrows with convergence.
- **Invariants**: output `T_AGI` always within anchor ± `MAX_SHIFT`; deterministic for identical
  inputs (snapshot tests).

## Pipeline & validator tests (fixtures, offline)

The pipeline is tested against **recorded source responses** so tests are deterministic and offline
(no network, no LLM):

- **Schema conformance**: every sample validates against its zod schema; missing-citation samples
  are rejected.
- **Validator behavior**: planted bad data (out-of-range, low-confidence, contradictory across
  sources, outliers vs history) is **quarantined**; good data passes.
- **Determinism**: the whole pipeline is reproducible — identical fixtures yield identical
  `engine_state` (snapshot test).
- **Cadence selection**: a given tier processes only its due domains; slower factors carry momentum
  from the prior snapshot.

## Connector contract tests

Each source connector is tested against **recorded fixtures** of real responses:

- Parsing/normalization produces the expected `FactorSample`.
- **Staleness handling**: a stale/empty response yields a flagged, weighted-out sample, not a crash.
- Schema drift (a source changing shape) fails the contract test loudly so it's fixed before it
  pollutes data.

## Backtesting (does the model behave sensibly?)

Before any weight set ships, replay **historical** forecast + factor data through the engine and
verify the estimate would have moved reasonably:

- Feed time-ordered historical `factor_samples` → recompute `estimate_history`.
- Check for **no absurd jumps** (clamp + smoothing hold), and that major real events (e.g., a step
  change in frontier capability) move the date in the expected direction and magnitude.
- Publish a backtest report on/after launch ([13-ROADMAP](13-ROADMAP.md) Phase 4) — the model's own
  track record, including misses, is part of the honest framing
  ([11-SECURITY-LEGAL](11-SECURITY-LEGAL.md)).

## Integration & end-to-end

End-to-end happy path (from Phase 1 onward):

```
seed connectors with recorded fixtures
  → run one pipeline refresh (apps/pipeline)
  → assert: public/data/engine_state.<def>.json written
  → assert: estimate_history.json appended, status.json + sources.json updated
  → load the site against the JSON → clock renders the new T_AGI and eases to it
```

Also: data-contract tests (zod-valid JSON shapes, `stale: true` handling when the pipeline is
behind, graceful degradation when an optional file like `jobs.json` is missing), and validator
behavior under induced source failures (the run still writes a partial, flagged snapshot).

## Frontend & quality gates (CI)

- **Lighthouse CI**: enforces the Core Web Vitals + JS budgets from
  [08-PERFORMANCE](08-PERFORMANCE.md); regressions block merge.
- **Reduced-motion review**: the clock and panels remain legible and update discretely.
- **Cross-device/responsive** checks; visual review of the motion language.
- **Type-check + lint** across the monorepo on every PR.

## What "verified" means here

Because the headline output is an estimate, "correct" is defined operationally:
1. The engine is **provably deterministic and bounded** (unit tests + invariants).
2. Bad data is **provably contained** (Critic-gate tests + backtests).
3. The pipeline is **provably end-to-end wired** (E2E test).
4. The experience is **provably fast** (Lighthouse CI).

Meeting these four is the bar for shipping each phase.

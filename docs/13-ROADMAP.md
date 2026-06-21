# 13 — Roadmap & Milestones

A phased build that ships something beautiful early and deepens the engine and sourcing over time.
Each phase is independently demoable.

## Phase 0 — Scaffold & design foundation
**Goal:** a beautiful, static clock and the skeleton everything plugs into.

- Monorepo (pnpm/turbo): `apps/web`, `apps/worker`, `packages/{engine,agents,sources,db,config,shared}`.
- Design tokens, type, palette, motion primitives ([07-FRONTEND-DESIGN](07-FRONTEND-DESIGN.md)).
- `CountdownClock` animating to a **hardcoded** `T_AGI` (local `requestAnimationFrame`), with the
  reduced-motion path.
- App Router shell, RSC/PPR rendering, deployed to Vercel.

**Exit:** the home page looks finished and ticks smoothly; no data yet.

## Phase 1 — Engine v1 + thin pipeline
**Goal:** a real, recomputed date from a minimal free pipeline.

- `packages/engine`: deterministic estimator with the **anchor blend** (Metaculus + Manifold) and a
  small set of factors; unit-tested ([02-CLOCK-ENGINE](02-CLOCK-ENGINE.md)).
- `apps/pipeline`: fetch → validate → score → compute → write JSON; run by a GitHub Actions cron.
- Snapshots committed to `public/data/*.json`; the site reads them from the CDN.
- Methodology page renders the formula, weights, and `EstimateHistoryChart`.

**Exit:** the clock moves based on live forecast data; the methodology page explains why — at $0.

## Phase 2 — Full pipeline + factor depth
**Goal:** the comprehensive engine.

- All source connectors for free structured feeds ([04-DATA-SOURCES](04-DATA-SOURCES.md)).
- Full deterministic validator (bounds/cross-source/outlier), templated narrative, curated timeline.
- Complete factor registry (internal + external), EWMA smoothing, bounded `Δ`, "top movers."
- Source-health board (`sources.json`) + run `status.json` telemetry ([10-OBSERVABILITY](10-OBSERVABILITY.md)).
- All three cadence tiers wired as separate GitHub Actions workflows.

**Exit:** dozens of cited sources feed a transparent, well-guarded estimate — still $0.

## Phase 3 — Surrounding panels
**Goal:** the rest of the product surface.

- `/timeline` — auto-detected + curated major events.
- `/jobs` — automation % by sector/occupation + emerging-jobs list, sourced & cited.
- `/sources` — full attributed directory with health.

**Exit:** timeline, jobs, and sources are live and source-backed.

## Phase 4 — Polish & launch
**Goal:** beautiful, fast, accountable.

- Optional WebGL/shader hero (performance-gated), motion polish, scroll choreography.
- PPR/streaming tuning; Lighthouse CI budgets green ([08-PERFORMANCE](08-PERFORMANCE.md)).
- A11y + SEO/OG pass; free-tier alerting (GitHub Actions → webhook); backtest report published.
- Production hardening and runbooks.

**Exit:** public launch — running at $0.

## Dependency order

```
Phase 0 ─▶ Phase 1 ─▶ Phase 2 ─▶ Phase 3 ─▶ Phase 4
  design     engine     full       panels    polish
  + clock    + thin     pipeline +           + launch
             pipeline   sourcing
```

The engine and shared types (Phase 0–1) are the spine; the full pipeline (Phase 2) and panels
(Phase 3) are additive; polish (Phase 4) is continuous but gated for launch.

## Optional (post-launch, only if you choose to spend)

The free build is complete at Phase 4. Optional paid upgrades — sub-minute realtime (worker +
Redis + SSE) and LLM-assisted extraction of unstructured sources — are isolated add-ons, off by
default ([12-COST-MODEL](12-COST-MODEL.md), [03-AGENT-ARCHITECTURE](03-AGENT-ARCHITECTURE.md)).

## Definition of done per phase

Each phase must pass its slice of [14-TESTING](14-TESTING.md) — engine unit tests, validator/fixture
tests, connector contract tests, and (from Phase 1) an end-to-end refresh → render check — before
it's considered shipped.

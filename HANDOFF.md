# AGI Countdown — Handoff

_Last updated: 2026-06-22._

## What this is

A "Worldometer for AGI": a live, deterministic clock counting down to AGI. A pipeline turns public
forecasts + live signals into static JSON; a Next.js site renders the clock and animates locally.
Runs at **$0** (GitHub Actions + static host), **no database, no required LLM**. Read
[`CLAUDE.md`](CLAUDE.md) first — it is the source of truth for conventions and the golden rules.

## Status: functional & shipping

Wired end-to-end and verified on each change: `pnpm typecheck`, `pnpm test` (engine 5 + pipeline 14),
`pnpm validate:data` (10/10), `pnpm --filter @agi-countdown/web build` (12 static routes). Commit
directly to **master**; the refresh bot also pushes data to master (rebase when it diverges — source
commits never conflict with its `/data` commits).

## The clock engine (`packages/engine` + `apps/pipeline`) — the core

`T_AGI = Anchor + Δ_factors`, then a self-adjusting band.

- **Directional Δ model:** `Σ −sign·weight·intensity·confidence`. `intensity` is the 0..1 reading (no
  centering). **Accelerators only ever pull sooner; decelerators only ever push later** — the reading
  sets strength, never sign. Decelerators get a **precautionary convex √ response**
  (`applyResponseCurve`) so an early/weak headwind is amplified. `CONTRIBUTION_SCALE` calibrates
  magnitude; per-definition `domainEmphasis` differentiates the three modes; clamp to `±maxShiftMonths`;
  EWMA smoothing.
- **Rolling normalization** (`normalizeAgainstHistory`, reads `factor_history.json`): z-score /
  empirical percentile vs each factor's own history; falls back to raw level until enough varied
  history exists. Trailing std → `volatility`.
- **Self-adjusting variance band** (`computeConfidenceBand`): σ(months) =
  `HORIZON_SIGMA × months-to-arrival` ⊕ factor volatility (in quadrature). Inner = ±1σ (~68% likely),
  outer = ±2σ (~95%). Replaced a fixed P25/P75 fraction + the decade-wide forecaster spread. Earliest
  floored to the present.
- 18 Δ factors + the forecast anchor; newest is **data-availability** (the "data wall", Epoch-cited
  decelerator). 5 **live** connectors (Manifold, arXiv, GDELT, GitHub, Hugging Face) + cited curated
  seeds for the rest.

## Site features (`apps/web`)

`/` clock (range + likely window + Share + Track Record) · `/timeline` · `/jobs` (sector + **region** +
**revenue-at-risk**, 2026 data) · `/methodology` (engine **flow graph** + **scenario explorer** +
factor table) · `/sources` (filterable) · `/developers` (JSON API + embeddable **badge.svg**) ·
`/about`. Build-time `opengraph-image` for link unfurls.

## Commands (from repo root, via corepack)

```bash
corepack pnpm install            # install
corepack pnpm dev                # run the site
corepack pnpm refresh            # recompute snapshots → apps/web/public/data (+ badge.*)
corepack pnpm validate:data      # zod-validate the 10 static data files
corepack pnpm typecheck && corepack pnpm test
```

## Gotchas

- **Client components must not import `@/lib/static-data`** (it pulls `node:fs`). Use `import type`
  for its types and `@/lib/format` for runtime date helpers.
- **`next/og` (Satori):** every `<div>` with >1 child needs explicit `display:flex`; don't mix a text
  literal with an expression in one node — use `` {`~ ${v}`} ``.
- After changing engine math, **always** `pnpm refresh` and eyeball all three definitions.
- Don't commit build artifacts; LF→CRLF warnings on commit are benign (Windows).

## Possible next steps

Largely complete (network graph, live connectors, variance band, pipeline tests, share/OG, badge/API,
scenario explorer, track record, sources filter). Remaining ideas: a deeper **backtest / accuracy**
view once history accrues, **news ↔ factor** linking, an inline **glossary** for the definitions, and
richer per-definition OG images. Confirm direction with the owner before large new work.

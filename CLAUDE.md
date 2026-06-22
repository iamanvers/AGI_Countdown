# CLAUDE.md

Guidance for working in this repo. Read this before making changes.

## What this is

**AGI Countdown** — a Worldometer-style live clock counting down to AGI. A deterministic pipeline
turns public forecasts + live signals into static JSON snapshots; a Next.js site renders the clock
and animates it locally. Runs at **$0** (GitHub Actions + a static host), no database, no LLM.

## Golden rules (do not break these)

1. **Determinism boundary.** The date is computed only by `packages/engine` (a pure function). No
   LLM, no randomness, no I/O in the engine. Agents/connectors gather and validate data; the engine
   computes. See `docs/adr/0005-determinism-boundary.md`.
2. **Zero-cost.** No paid services, no always-on server, no required LLM. Free public APIs +
   committed JSON only. Any LLM use is optional and env-gated (off by default).
3. **Every datum is cited with a real URL.** No `example.com` placeholders. `packages/validate`
   enforces `url()` on citations — the build/`validate:data` will reject fakes.
4. **Honest framing.** Always show the confidence band; flag stale/failed sources, never fake them.
5. **No secrets in the web app.** Source API keys / tokens live only in GitHub Actions or the
   `/api/refresh` server route env. The static site ships no secrets.

## Commands

```bash
corepack pnpm install                 # install (pnpm@9 workspace; use corepack)
corepack pnpm dev                     # run the site (apps/web) at :3000
corepack pnpm build                   # build all packages + the site
corepack pnpm typecheck               # type-check the whole workspace
corepack pnpm test                    # unit tests (engine is the main suite)
corepack pnpm refresh                 # recompute snapshots (live + curated) -> apps/web/public/data
corepack pnpm refresh -- --cadence hourly   # one tier only (hourly|daily|weekly|monthly|all)
corepack pnpm validate:data           # validate the 9 static JSON files against zod schemas
```

Always run from the **repo root** (scripts resolve paths relative to it).

## Architecture / data flow

```
apps/pipeline (GitHub Actions: cron or /api/refresh dispatch)
  fetch (live + curated)  →  validate (zod + bounds/outlier)  →  engine.compute()
  →  write apps/web/public/data/*.json  →  git commit  →  site redeploys

apps/web (Next.js, static): reads /data/*.json from the edge; clock animates via rAF
```

The **request path does no compute** — it serves precomputed static JSON. The time-series history
is the git history + `estimate_history.json`.

## Monorepo layout

| Path | Role |
|---|---|
| `apps/web` | Next.js App Router site. Pages: `/` (clock + share + track record), `/timeline`, `/jobs` (sector + region + revenue-at-risk), `/methodology` (flow graph + scenario explorer), `/sources` (filterable), `/developers` (JSON API + badge), `/about`. Route: `/api/refresh`. Build-time `opengraph-image`. |
| `apps/pipeline` | Deterministic refresh job (`src/pipeline.ts`, `src/refresh.ts`). |
| `packages/engine` | Pure estimator math: anchor blend, bounded Δ, confidence band, movers. Unit-tested. |
| `packages/sources` | Connectors + curated data. `live-connectors.ts`, `curated-connector.ts`, `curated-data.ts`, `connector-registry.ts`. |
| `packages/config` | `factor-registry.ts`, `agi-definitions.ts`, `source-registry.ts` (all `as const satisfies`). |
| `packages/validate` | zod schemas for every static data file (`staticDataSchemas`). |
| `packages/shared` | Shared types (`EngineState`, `FactorSnapshot`, …). |
| `docs/` | Architecture of record + ADRs. |

## The engine (packages/engine)

```
T_AGI = Anchor + Δ_factors        // Δ clamped to ±maxShiftMonths, months
```

- **Anchor**: weighted blend of forecast medians via `anchor.sources` (weighted quantile).
- **Δ_factors**: `Σ −sign·weight·intensity·confidence`. **Directional model** — `intensity` is the
  factor's 0..1 reading (no centering), so an accelerator always pulls **sooner** and a decelerator
  always pushes **later**; the reading sets the *strength*, never the sign (a weak decelerator is a
  weak headwind, not a tailwind). Decelerators get a **precautionary convex (√) response**
  (`applyResponseCurve`) — an early/weak headwind is amplified — while accelerators stay linear.
  Weights are scaled by `CONTRIBUTION_SCALE` (pipeline calibration) and per-definition
  `domainEmphasis`, so the shift and movers **differ across the three modes**. Then clamped to
  `±maxShiftMonths` and EWMA-smoothed across runs (α in `SMOOTHING_ALPHA`).
- **Rolling normalization** (pipeline, `normalizeAgainstHistory`): each factor's smoothed level is
  re-expressed against its own persisted history (`factor_history.json`) — a **z-score** (tanh-
  squashed; 0.5 = at trailing mean) for `zscore`/`log-zscore` factors, an **empirical percentile**
  for `momentum-01` factors — so the date moves on *momentum*, not static curated constants. Falls
  back to the raw level until `NORM_MIN_POINTS` of varied history exist (constant curated values keep
  their absolute reading). The trailing std is fed to the engine as `volatility` (widens the band).
  Surfaced per factor on `/methodology`.
- **progress%**: separate 0–100 capability meter, scaled by each definition's `progressScale`
  (weak 1.25 → reads closer; strong 0.5 → reads farther). Not derived from the date.
- **Floors**: `tAgi` and the band's earliest are floored to the present — never a past date.
- **Confidence band** (`computeConfidenceBand`): a **self-adjusting ±σ** band, not percentiles. σ (in
  months) = horizon uncertainty (`HORIZON_SIGMA × months-to-arrival`) and live factor volatility added
  in quadrature. Inner `likelyEarly`/`likelyLate` = ±1σ (~68%), outer `earlyP10`/`lateP90` = ±2σ
  (~95%). Tightens near-term / when signals agree, widens far-out / when noisy. Earliest floored to now.
- **UI shows a range, not false precision**: the hero renders a coarse central estimate
  (`formatQuarterYear`, e.g. "≈ Q2 2031") plus the **likely (±1σ) window** as a date range
  (`formatArrivalRange`); the live countdown still ticks to `tAgi`. Dates elsewhere use month-year.
- Weights/signs/definitions are **config** in `packages/config`, surfaced on `/methodology` (which
  reads `methodology.json`).

## How to add a data source

1. Add a `SourceDef` to `packages/config/src/source-registry.ts` (id, domain, parser, real `url`,
   cadence). Reference it from the relevant factor's `sources[]` in `factor-registry.ts`.
2. Either:
   - **Live**: add a connector in `packages/sources/src/live-connectors.ts` (match `parser`), and
     register it in `connector-registry.ts`. Wrap fetch in try/catch with a timeout; return
     `samples: []` + a warning on failure (the pipeline falls back to curated).
   - **Curated**: add a seed (with a real citation) to `curatedFactorSeedsBySource` in
     `curated-data.ts`. `findConnector` routes any non-live parser to the curated connector.
3. Run `pnpm refresh` then `pnpm validate:data`.

## How to add a factor

Add a `FactorDef` to `factor-registry.ts` (id, category, domain, `sources`, `sign` (+1 accelerator
/ −1 decelerator), `weight`, `bounds`). Provide samples for it (live or curated). The pipeline
aggregates samples per factor (confidence-weighted) and maps the reading onto a 0..1 **intensity**
(`factorIntensity`) that the engine applies in the factor's natural direction (sign). A `+1` factor
only ever pulls sooner; a `−1` factor only ever pushes later. `forecast-consensus-anchor` is special
— it feeds the **anchor**, not Δ.

## Data contract (apps/web/public/data)

`engine_state.{weak-agi,transformative-ai,strong-agi}.json`, `estimate_history.json`,
`factors.json`, `timeline.json`, `jobs.json`, `sources.json`, `status.json`, `news.json`,
`methodology.json`, `factor_history.json`. The first 10 are validated by `packages/validate`
(`pnpm validate:data`); `methodology.json` (derived from the registries + run stats) and
`factor_history.json` (per-factor level history powering rolling normalization) are not separately
validated.

- **`factor_history.json`** — trailing per-factor smoothed levels (last `FACTOR_HISTORY_LIMIT`
  runs); the rolling z-score / percentile normalization reads it. The git history is the long series.
- **`badge.svg` / `badge.json`** — written by `writeBadge` to the **site root** (`apps/web/public`,
  not `/data`) each refresh: an embeddable SVG + shields-endpoint badge of the default estimate,
  documented on `/developers`. `jobs.json` now also carries `regions[]` and `revenueAtRisk`.

- **`sources.json`** — all ~140 sources: live "signal" feeds (with health) + a tiered reference
  catalog (primary/secondary/tertiary, `status: "reference"`). Only signal sources are fetched.
- **`news.json`** — live "Latest developments" feed (Hacker News Algolia primary, GDELT fallback),
  deduped, AI-relevance-filtered, frontier-lab-tagged (`packages/sources/src/news.ts`).
- **`timeline.json`** — curated landmark milestones (`curatedTimeline`) + **strictly** auto-derived
  milestones (real model releases / new arch / major policy only — `isReleaseMilestone` in
  `pipeline.ts`). Per-month historical fills come from `fetchHistoricalMilestones`.
- **`jobs.json`** — curated sectoral data (`curatedJobs`): per-sector workforce share, automation
  exposure, emerging + fading roles.
- **`methodology.json`** — full transparency: per-factor weight/sign/normalization/reading/sources +
  per-definition max-shift, capability scale, and anchor-blend weights.

## Triggering a refresh from the website

`/api/refresh` (Node route, `apps/web/app/api/refresh/route.ts`) dispatches the
`refresh-manual.yml` GitHub workflow via the GitHub API when `GITHUB_DISPATCH_TOKEN` +
`GITHUB_REPOSITORY` are set; otherwise it returns a graceful "not-configured" message. The
`RefreshButton` client component calls it. Keep the token server-only.

## Conventions & gotchas

- **TypeScript strict**; the registries use `as const satisfies` — when building `Map`s from them,
  type keys explicitly as `string` (the literal-union inference otherwise rejects `string` lookups).
- **`pnpm refresh` uses real `new Date()`** by default. Override with `--now <iso>` or `PIPELINE_NOW`
  only for reproducible tests. Never reintroduce a hardcoded default `now`.
- After deleting/renaming a page, `rm -rf apps/web/.next` before typecheck (stale `.next/types`
  reference deleted routes).
- The web app reads data via `fs` at build time (static generation) and via relative `fetch('/data/..')`
  client-side. Keep fetches relative; set `NEXT_PUBLIC_SITE_URL` for metadata base only.
- Windows + Git Bash environment; prefer `corepack pnpm ...`.
- **Don't** commit build artifacts (`.next/`, `dist/`, `node_modules/`) — see `.gitignore`.

## Git workflow

- **Commit directly to `master`.** No feature branches for routine work (owner preference).
- The refresh **bot writes to `master`** too: all `.github/workflows/refresh-*.yml` checkout
  `ref: master` and `git push origin HEAD:master`. The default branch is `master` (not `main`) —
  the `/api/refresh` dispatch ref and `GITHUB_REF_NAME` default to `master`.

## Where to look first

- Architecture & decisions: `docs/` (ADR-0006 = zero-cost/LLM-optional is the current default;
  ADR-0003/0004 are superseded).
- The clock math: `packages/engine/src/index.ts` (+ `index.test.ts`).
- The refresh: `apps/pipeline/src/pipeline.ts`.

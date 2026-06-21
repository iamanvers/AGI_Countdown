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
| `apps/web` | Next.js App Router site. Pages: `/` (clock), `/timeline`, `/jobs`, `/methodology`, `/sources`, `/about`. Route: `/api/refresh`. |
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
- **Δ_factors**: `Σ −sign·weight·normalized·confidence`, then clamped + (optionally) smoothed.
- **progress%**: separate 0–100 capability meter (benchmark / compute / deployment).
- Weights/signs/definitions are **config** in `packages/config`, surfaced on `/methodology`.

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
aggregates samples per factor (confidence-weighted) and centers them around the bounds midpoint
before the engine applies sign/weight. `forecast-consensus-anchor` is special — it feeds the
**anchor**, not Δ.

## Data contract (apps/web/public/data)

`engine_state.{weak-agi,transformative-ai,strong-agi}.json`, `estimate_history.json`,
`factors.json`, `timeline.json`, `jobs.json`, `sources.json`, `status.json`. All validated by
`packages/validate`. `timeline.json` and `jobs.json` come from curated data in `curated-data.ts`.

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

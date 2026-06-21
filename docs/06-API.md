# 06 — Data Access & Caching

> Reflects [ADR-0006](adr/0006-zero-cost-llm-optional.md): there is **no dynamic API and no SSE** in
> the default build. The site reads **static JSON files** from the edge CDN, produced by the
> pipeline. This is simpler, faster, and free.

## How the site gets data

The pipeline writes `public/data/*.json` ([05-DATA-MODEL](05-DATA-MODEL.md)); Next.js serves those
files from Vercel's edge CDN. "Endpoints" are just static paths:

| Path | Returns | Cache |
|------|---------|-------|
| `/data/engine_state.<definition>.json` | Latest snapshot (countdown, progress, band, movers) | CDN, immutable-ish with revalidate |
| `/data/estimate_history.json` | `T_AGI` over time (movement chart) | CDN |
| `/data/factors.json` | Current factor values + momentum + citations + flags | CDN |
| `/data/timeline.json` | Curated + structured events | CDN |
| `/data/jobs.json` | Automation % + emerging jobs | CDN |
| `/data/sources.json` | Source registry + health | CDN |

Pages can also import these at build time (RSC / ISR) so the initial HTML already contains the
snapshot — the clock is meaningful on first paint ([08-PERFORMANCE](08-PERFORMANCE.md)).

## Getting fresh data to the client

No server push is needed because the underlying estimate only changes when the cron runs:

1. **On load**, the page ships with the latest snapshot inlined (RSC/ISR) → clock starts animating
   immediately, locally.
2. **On cadence**, the client re-`fetch`es `/data/engine_state.<def>.json` (e.g., every few minutes,
   matched to the refresh tier) and **eases** the clock to any new target.
3. **A pipeline commit** triggers a Vercel redeploy / ISR revalidation, so even fully static
   renders pick up new data.

This keeps the experience live without Redis, a worker, or SSE.

> **Optional realtime upgrade** (off by default): add a tiny worker + Upstash Redis pub/sub and an
> SSE route for sub-minute push. Not part of the free build — see
> [12-COST-MODEL](12-COST-MODEL.md).

## Caching strategy

| Layer | Mechanism | Notes |
|-------|-----------|-------|
| CDN edge | Static asset caching + `stale-while-revalidate` | Serves instantly, revalidates in background |
| Build-time | RSC/ISR inlines the snapshot into HTML | Meaningful first paint, no client round-trip |
| Client | `fetch` revalidation on cadence | Picks up new snapshots; clock animates locally meanwhile |

Because snapshots change at most once per refresh tier, cache TTLs are generous and the origin is
barely touched.

## Definition switching

The `DefinitionToggle` ([07-FRONTEND-DESIGN](07-FRONTEND-DESIGN.md)) simply fetches a different
static file — `engine_state.transformative-ai.json` vs `…weak-agi.json` — both precomputed by the
pipeline. No server work; the date visibly shifts.

## Error handling & degradation

- The site **always** has a usable payload: the last committed snapshot. If the pipeline is behind,
  the snapshot's `stale: true` flag drives an honest "data catching up" indicator
  ([10-OBSERVABILITY](10-OBSERVABILITY.md)).
- A missing optional file (e.g., `jobs.json` early in the build) degrades that panel gracefully; the
  clock is unaffected.
- There are **no public write endpoints** — the only writer is the GitHub Actions pipeline
  committing to the repo ([11-SECURITY-LEGAL](11-SECURITY-LEGAL.md)).

## Security

- The web tier serves **public static JSON** and holds **no secrets**.
- All source fetching (and any free API keys) happens in the **pipeline** on GitHub Actions, never
  in the browser. See [11-SECURITY-LEGAL](11-SECURITY-LEGAL.md).

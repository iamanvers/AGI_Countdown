# 05 — Data Model & Storage

> Reflects [ADR-0006](adr/0006-zero-cost-llm-optional.md): the default store is **JSON snapshots
> committed to the repo** — git history is the time-series. No Redis, no managed database. MongoDB
> Atlas **M0** (free) is an optional upgrade behind the same repository interface.

All data is validated with **zod** at the pipeline boundary. Schemas live in `packages/validate` and
types are re-exported from `packages/shared` so the web app and pipeline share one definition.

## The store: `public/data/*.json` (read by the site from the CDN)

```
apps/web/public/data/
  engine_state.weak-agi.json          # latest snapshot per AGI definition
  engine_state.transformative-ai.json
  engine_state.strong-agi.json
  estimate_history.json               # append-only T_AGI series → the movement chart
  factors.json                        # current factor values + momentum + citations + flags
  timeline.json                       # curated + structured events
  jobs.json                           # automation % by sector/occupation + emerging jobs
  sources.json                        # source registry + health / last-fetch
```

Why files:
- **Free & zero-ops** — no DB to provision, secure, or pay for.
- **Versioned for free** — `git log` shows every past state; the time-series is the commit history.
- **Fast** — static files served from the edge CDN are sub-ms and globally cached.

> **Git churn:** write these to a dedicated **`data` branch** (or a separate data repo) so the main
> branch stays clean; downsample old raw samples into daily aggregates to bound size.

## Schemas (representative)

```ts
// engine_state.<definition>.json — the snapshot the site renders
type EngineState = {
  runId: string;
  ts: string;                          // ISO — when computed
  definition: 'weak-agi' | 'transformative-ai' | 'strong-agi';
  tAgi: string;                        // ISO — countdown target
  progress: number;                    // 0..100
  band: { earlyP10: string; lateP90: string };
  anchor: string;                      // ISO baseline before Δ
  deltaMonths: number;                 // applied shift (post-clamp)
  movers: Mover[];                     // ranked factor contributions this run
  rates?: { computePerSec?: number; papersPerDay?: number; investUsdPerSec?: number };
  stale?: boolean;
};

type Mover = {
  factorId: string;
  contributionMonths: number;          // signed
  rationale: string;                   // templated copy (no LLM)
  citation: string;
};

// estimate_history.json — append-only
type EstimatePoint = { ts: string; definition: string; tAgi: string; progress: number };

// factors.json — current state + provenance
type FactorSnapshot = {
  factorId: string;
  sourceId: string;
  ts: string;
  raw: number | string;
  normalized: number;
  confidence: number;                  // 0..1, from validation rules
  citation: string;
  quarantined: boolean;                // excluded from blend + flagged if true
};

// timeline.json
type EventDoc = {
  date: string;
  title: string;
  summary: string;
  significance: 'minor' | 'major' | 'landmark';
  category: string;                    // 'model-release' | 'policy' | 'funding' | ...
  citation: string;
  curatedBy: 'curated' | 'feed';
};

// jobs.json
type JobsImpact = {
  ts: string;
  overallAutomationPct: number;
  bySector: Array<{ sector: string; automationPct: number; source: string }>;
  byOccupation: Array<{ onetCode: string; title: string; exposurePct: number; source: string }>;
  emergingJobs: Array<{ title: string; description: string; demandSignal: number; source: string }>;
};

// sources.json — registry + health
type SourceStatus = {
  sourceId: string;
  name: string;
  url: string;
  lastFetchedAt: string;
  status: 'ok' | 'stale' | 'failed';
  errorRate: number;
};
```

## History & lifecycle (without a database)

- **Time-series** = the sequence of commits + `estimate_history.json` (append-only). For factor-level
  history, keep `factors.json` snapshots per run, or roll daily files `factors/YYYY-MM-DD.json`.
- **Downsampling** — high-frequency raw samples (e.g., hourly GDELT) are aggregated to daily values
  before long-term retention, so the repo stays small.
- **Reading history** — the pipeline reads the previous snapshot(s) from the repo to compute EWMA
  momentum; the methodology chart reads `estimate_history.json`.

## Reading & writing

```
PIPELINE (write, in GitHub Actions):
  fetch → validate → score → engine.compute() → narrate → curate
    → write public/data/*.json  (+ append estimate_history.json)
    → git commit + push   → Vercel redeploy / ISR revalidate

WEB (read, on the edge):
  GET /data/engine_state.<def>.json   (CDN, cached)   → render
  client re-fetches on cadence to pick up new snapshots (no SSE, no polling storm)
```

## Provenance & consistency

- **One writer** — only the pipeline writes data; the web app is strictly read-only. This keeps
  history clean (one commit per refresh) and avoids races.
- **Provenance is mandatory** — every `FactorSnapshot` carries `sourceId`, `citation`, `confidence`,
  and `quarantined`, so any number on the site traces to its origin.
- **Idempotency** — a refresh overwrites the latest snapshot and appends one history point; a failed
  run leaves the prior state intact.

## Optional upgrade: free MongoDB Atlas M0

If files become awkward (large history, ad-hoc queries), swap the storage adapter to **Atlas M0**
(free 512 MB) — time-series collections for `factor_samples`/`estimate_history`, documents for the
rest. The pipeline writes through a small repository interface, so this is a localized change and
the web app can still read a CDN-cached JSON projection. See
[ADR-0004](adr/0004-atlas-plus-redis-storage.md) (superseded) for the original DB schema sketch.

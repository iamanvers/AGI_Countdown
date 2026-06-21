# 10 — Observability & Source Health

> Reflects [ADR-0006](adr/0006-zero-cost-llm-optional.md): observability is built from **free
> primitives** — GitHub Actions run history, the committed git diff, and a published
> `sources.json`/`status.json`. No paid monitoring, no agent token-cost dashboards (there are no
> token costs in the default build).

A fully-automated pipeline is only trustworthy if its health is **visible** — to operators and, in
part, to the public. Two goals: keep the pipeline running, and keep the product **honest** about the
state of its data.

## Source health (public + operator)

Each refresh writes `sources.json` ([05-DATA-MODEL](05-DATA-MODEL.md)), surfaced on the **public
Sources page** via `SourceHealthBoard`:

| Field | Meaning |
|-------|---------|
| `lastFetchedAt` | When the source last produced a usable value |
| `status` | `ok` · `stale` · `failed` |
| `errorRate` | Rolling failure rate across recent runs |

Rules:
- A **stale** or **failed** source is **excluded from the blend and flagged**, never silently
  dropped — the UI shows it and the engine weights it out.
- Repeated failures keep a source in `failed` until it recovers (the deterministic analogue of a
  circuit breaker).
- The home UI shows a `StalenessTag` when the served snapshot is behind (`stale: true`).

## Run telemetry (free, built-in)

Every refresh is a **GitHub Actions run** — its logs, duration, and pass/fail are free and retained
by GitHub. In addition, the pipeline writes a compact `status.json`:

```ts
type RunStatus = {
  runId: string;
  startedAt: string;
  finishedAt: string;
  cadence: 'hourly' | 'daily' | 'weekly';
  domainsRun: string[];
  sourcesOk: number;
  sourcesFailed: number;
  quarantinedSamples: number;          // how many bad values the validator caught
  deltaMonths: number;                 // how far the live model shifted the date this run
  bandWidthDays: number;               // confidence width
  status: 'ok' | 'degraded' | 'failed';
};
```

The git commit itself is an audit record: the diff shows exactly which numbers changed, and `git
blame`/`git log` reconstruct any past state. This replaces the database `run_ledger` for free.

## Metrics to watch

| Category | Metric | Source |
|----------|--------|--------|
| Freshness | Per-source staleness; % factors fresh within cadence | `sources.json` |
| Quality | Quarantine rate; cross-source disagreement; confidence distribution | `status.json`, `factors.json` |
| Engine | `deltaMonths` magnitude (is the live model swinging?); band width over time | `status.json`, `estimate_history.json` |
| Reliability | Run success/failure; run duration | GitHub Actions history |
| Web | Core Web Vitals; CDN cache hit rate | Vercel Speed Insights (free Hobby quota) |

## Alerting (free)

| Trigger | Action |
|---------|--------|
| Pipeline run fails | GitHub's built-in failed-workflow notifications (email/Slack via free webhook) |
| Source `failed` / high error rate | Reflected on the Sources page; visible in `status.json` |
| `deltaMonths` repeatedly hits the `MAX_SHIFT` clamp | Investigate data quality / weights (review the committed diffs) |
| Core Web Vitals regression | Vercel alert; investigate the recent deploy |

GitHub Actions can post a message to a free Slack/Discord webhook on failure — enough alerting for a
$0 project without any paid monitoring service.

## Honest degradation

The system **degrades visibly, not silently**:
- Missing data → factor weighted out + flagged, not faked.
- Pipeline behind → last good snapshot served with a staleness indicator; the clock keeps ticking
  locally.
- Bad data caught by the validator → quarantined and **counted** in `status.json`, never reaching
  the engine.

This is the operational expression of the project's core value: the date is an **estimate**, and the
site is transparent about how good the underlying data currently is — using only free tooling.

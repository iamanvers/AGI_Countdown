# ADR-0004 — MongoDB Atlas + Redis hot cache

- **Status:** Superseded by [ADR-0006](0006-zero-cost-llm-optional.md)
- **Date:** 2026-06-21
- **Related:** [05-DATA-MODEL](../05-DATA-MODEL.md), [08-PERFORMANCE](../08-PERFORMANCE.md)

> **Superseded.** Under the $0-cost constraint, the default storage is **JSON snapshots committed to
> the repo** (git history = the time-series) served from the edge CDN — no Redis, no managed DB.
> See [ADR-0006](0006-zero-cost-llm-optional.md). MongoDB Atlas **M0** (free) remains an optional
> upgrade path. This record is kept for history.

## Context

The system has two very different storage needs:

1. **Durable history & flexible documents** — time-series `factor_samples` and `estimate_history`,
   plus evolving documents (`events`, `jobs_impact`, `run_ledger`) whose shape will change as the
   factor registry grows.
2. **A blazing-fast hot path** — the site must read the latest `engine_state` in sub-milliseconds at
   the edge, and the worker needs a queue + pub/sub to coordinate runs and fan out live updates.

## Decision

Use **two stores**:

- **MongoDB Atlas** — time-series collections for high-frequency factor data and the estimate
  history; flexible documents for everything else. (MongoDB MCP tooling is available in the dev
  environment, easing schema work and queries.)
- **Redis (Vercel KV / Upstash)** — hot `engine_state:latest:<definition>`, the job queue +
  dead-letter, the `engine:updated` pub/sub channel, per-source rate-limit counters, and the run
  mutex.

Write path: worker → Atlas (history) + Redis (hot). Read path: web → Redis (edge), with Atlas
fallback on a cold cache.

## Consequences

- Each store plays to its strength: Atlas for durable/flexible/time-series; Redis for speed and
  coordination.
- The request path never touches Atlas → instant reads and trivial scaling under traffic.
- Two systems to operate and keep consistent — mitigated by a **single-writer** rule (only the
  worker/engine writes canonical state) and idempotent, run-keyed writes.

## Alternatives considered

- **Vercel Postgres + KV** — viable and Vercel-native, but the factor/event documents are
  schema-fluid and time-series-heavy, which Mongo fits more naturally; MCP tooling is also a plus.
- **Single store (Atlas only)** — rejected: request-path reads would hit the DB directly, losing the
  sub-ms edge reads that make the site feel instant.

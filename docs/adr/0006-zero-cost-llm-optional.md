# ADR-0006 — Zero-cost, LLM-optional architecture

- **Status:** Accepted
- **Date:** 2026-06-21
- **Supersedes:** [ADR-0003](0003-multi-agent-fleet-on-dedicated-worker.md) (dedicated worker fleet), [ADR-0004](0004-atlas-plus-redis-storage.md) (Atlas + Redis)
- **Builds on:** [ADR-0005](0005-determinism-boundary.md) (determinism boundary)

## Context

A hard new constraint: **the project must run at $0 with no recurring costs.** The previous design
(ADR-0003, ADR-0004) used a multi-agent **Claude LLM fleet** on an always-on worker, plus MongoDB
Atlas and Redis. The LLM fleet is the dominant variable cost, and an always-on worker + managed
Redis are recurring costs.

The key realization is that **[ADR-0005](0005-determinism-boundary.md) already removed the LLM from
the critical path**: the date is computed by deterministic code, never emitted by a model. The LLM
was only doing four ancillary jobs, each of which has a free, deterministic substitute:

| LLM role (old) | Deterministic / free replacement |
|----------------|----------------------------------|
| Extract numbers from unstructured pages (press releases, PDFs) | Use **structured APIs/CSV/JSON only**; curate the rare unstructured value in a JSON file |
| Critic / verification | Rule-based validation: zod schemas + range, cross-source, and outlier checks |
| Narrative ("why the clock moved") | **Templated** copy generated from the numeric movers |
| Timeline event detection from news | Curated `events.json` + structured feeds (GitHub releases, arXiv) |

With the LLM gone, a refresh is just **fetch structured data → validate → compute → write JSON** —
a short batch job that needs no always-on worker, no Redis, and no managed database.

## Decision

Adopt a **fully deterministic, zero-cost architecture**; make the LLM an **optional, off-by-default
enhancement**.

- **Scheduler + compute:** **GitHub Actions** scheduled workflows (free) run a Node/TS pipeline
  script per cadence tier.
- **Sources:** **free structured feeds only** by default (Metaculus, Manifold, Epoch CSV, GDELT,
  arXiv, GitHub, EIA/Ember, OpenRouter, HF, BLS, O*NET, FRED). Keys (when needed) are free and live
  in GitHub Actions secrets. Unstructured-only signals are curated JSON or omitted.
- **Verification:** deterministic rules in `packages/engine`/`packages/validate` (zod + bounds +
  cross-source + outlier), replacing the Critic agent.
- **Narrative:** templated movers copy, replacing the Synthesis agent's prose.
- **Storage:** **JSON snapshots committed to the repo** — `git` history is the time-series. No DB.
  (Optional free upgrade path: MongoDB Atlas **M0** free tier or Turso/Supabase free.)
- **Delivery:** Next.js on **Vercel Hobby** (free) serving static JSON from the edge CDN; the clock
  animates locally and revalidates on cadence. No Redis hot cache, no SSE worker. (Alt: Cloudflare
  Pages / GitHub Pages, also free.)
- **LLM:** an optional `packages/llm` module, gated behind an env flag + key, **disabled by
  default**. The product is fully functional without it.

## Consequences

- **$0 recurring cost** and far **fewer moving parts** (no worker, no Redis, no managed DB).
- The architecture is **simpler and more robust** for this data, which changes slowly.
- Outputs remain **reproducible and auditable** — unchanged engine math, now with no
  non-determinism anywhere in the default build.
- **Trade-offs (accepted):**
  - Refresh cadence is bounded by GitHub Actions' practical scheduling (hourly reliably; sub-hourly
    is best-effort) — fine for slow-moving AGI-timeline data.
  - Updates are at cron cadence, not real-time push — acceptable; the clock feels live via local
    animation.
  - Unstructured-only signals need curation or are dropped — core signals are all structured/free.
  - Committing data to the repo adds git churn — mitigated by writing to a dedicated `data` branch
    (or squashed data commits / a separate data repo).

## Alternatives considered

- **Keep the LLM fleet** — rejected: violates the $0 constraint; unnecessary given ADR-0005.
- **Free always-on worker (Render/Fly free)** — rejected as the default: free PaaS tiers spin down
  or are shrinking/unreliable; a GitHub Actions batch job is genuinely free and sufficient since the
  refresh is short and deterministic.
- **Free managed DB instead of repo JSON** — kept as an **optional** path (Atlas M0); not the
  default because committed JSON is simpler, zero-ops, and inherently versioned.

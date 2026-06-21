# 01 — System Architecture

> Reflects [ADR-0006](adr/0006-zero-cost-llm-optional.md): a **$0**, deterministic, LLM-optional
> design. No always-on worker, no Redis, no managed database in the default build.

## Core principle: the request path is read-only and static

Everything is precomputed on a schedule and written to **static JSON**. A user request just reads a
small JSON file from the edge CDN — there is no per-request compute, no database query, and no LLM
call. This is what makes the site instant and free to serve at any scale.

```
   GitHub Actions (cron, free)                                  Vercel Hobby (free, edge CDN)
   ┌──────────────────────────────────────┐                    ┌──────────────────────────────┐
   │ apps/pipeline (deterministic):        │                    │ Next.js App Router (RSC/ISR) │
   │   1. FETCH free structured sources    │     commit JSON     │   reads /data/*.json (CDN)    │
   │   2. VALIDATE (zod + bounds + outlier) │ ─────────────────▶ │   ┌────────────────────────┐ │
   │   3. SCORE (normalize + EWMA)         │   to repo/data branch│  │ CountdownClock (local  │ │
   │   4. COMPUTE packages/engine ─────────┼─▶ T_AGI, progress%, │  │ requestAnimationFrame) │ │
   │   5. NARRATE (templated movers copy)  │      band, movers   │  └────────────────────────┘ │
   │   6. CURATE (events + structured feeds)│                    │   revalidates JSON on cadence│
   │   7. WRITE public/data/*.json         │                    └──────────────────────────────┘
   └──────────────────┬───────────────────┘                              ▲
                      │ git push                                          │ push → auto-deploy / ISR
                      └───────────────────────────────────────────────────┘
```

See [09-DEPLOYMENT](09-DEPLOYMENT.md) for the concrete free stack and
[03-AGENT-ARCHITECTURE](03-AGENT-ARCHITECTURE.md) for the pipeline stages.

## The determinism boundary (non-negotiable, and now total)

> **Data goes in; a pure deterministic function in `packages/engine` computes the date.** No LLM is
> in the critical path — in the default build, no LLM is anywhere.

Why it matters:

- **Reproducibility** — given the same validated inputs, the engine always returns the same
  `T_AGI`. The number is a function of data, not of a model.
- **Auditability** — every date traces to inputs + weights; the methodology page shows the exact
  arithmetic, and git history shows every past state.
- **Legitimacy** — the speculative part (which signals matter, what they mean) is transparent
  config; the computational part is rigid code.
- **Zero cost** — because no model is required ([ADR-0006](adr/0006-zero-cost-llm-optional.md)).

This boundary is what made dropping the LLM painless: the date was never the model's job.

## Components

| Component | Runs where | Responsibility |
|-----------|-----------|----------------|
| **Web app** | Vercel Hobby (free) | Render pages; read static JSON from the CDN |
| **Pipeline** | GitHub Actions (free cron) | Deterministic fetch → validate → compute → write JSON |
| **Engine** | Shared pure-TS package | Deterministic estimator math (no I/O, no LLM) |
| **Sources** | Shared package, used by pipeline | Typed connectors + normalizers for free structured feeds |
| **Data** | JSON in the repo (git history) | Snapshots + time-series; no DB needed |
| **LLM module** *(optional, off)* | Pipeline, env-gated | Augments extraction/narrative only; never required |

## Data flow, step by step

1. **GitHub Actions cron** fires for a cadence tier (hourly / daily / weekly).
2. The **pipeline** runs `apps/pipeline`: connectors **fetch** the due free structured sources.
3. **Validate** — zod + range/cross-source/outlier rules quarantine bad data (the deterministic
   "critic").
4. **Score** — normalize and EWMA-smooth each factor against history read from the last JSON.
5. **Compute** — `engine.compute(samples)` returns `T_AGI`, `progress%`, `confidenceBand`, and
   ranked `movers`.
6. **Narrate** — templated copy explains the top movers; **Curate** updates the timeline.
7. **Write** — emit `public/data/*.json`, append `estimate_history`, and `git push`.
8. The push **triggers a Vercel deploy** (or on-demand ISR revalidate); the new snapshot is live on
   the CDN.
9. The **web app** reads the JSON; the clock animates locally and revalidates on cadence — no
   server push, no Redis, no SSE.

## Monorepo layout (proposed)

```
apps/
  web/                 # Next.js site (Vercel Hobby) — reads public/data/*.json
  pipeline/            # deterministic refresh script (run by GitHub Actions cron)
packages/
  engine/              # pure TS estimator math — no I/O, unit-tested, shared
  sources/             # one connector + normalizer per free structured source
  validate/            # zod schemas + bounds/cross-source/outlier rules ("critic")
  config/              # factor weights, AGI definitions, source registry
  shared/              # types shared between web and pipeline (FactorSample, EngineState, ...)
  llm/                 # OPTIONAL, off by default — extraction/narrative augmentation
docs/                  # this documentation suite
.github/workflows/     # refresh-hourly.yml, refresh-daily.yml, refresh-weekly.yml
```

A monorepo keeps the **engine** and **shared types** in lockstep between the pipeline (which
computes) and the web app (which renders against the same `EngineState`).

## Failure & resilience posture

- A failed or stale source is **excluded from the blend and visibly flagged**, never fatal — the
  pipeline writes a partial snapshot with the rest.
- The pipeline is **idempotent**; a failed GitHub Actions run just leaves the last good JSON in
  place. The site keeps serving it; the clock keeps ticking locally toward the last `T_AGI`.
- Bounded `Δ_factors` + EWMA smoothing prevent any single bad run from making the date jump
  ([02-CLOCK-ENGINE](02-CLOCK-ENGINE.md)).
- No worker / Redis / DB means **far fewer things that can break or cost money**.

See [10-OBSERVABILITY](10-OBSERVABILITY.md) for how runs and source health are surfaced (using free
GitHub Actions logs + a published `sources.json`).

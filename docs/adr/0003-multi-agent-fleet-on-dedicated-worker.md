# ADR-0003 — Multi-agent fleet on a dedicated worker

- **Status:** Superseded by [ADR-0006](0006-zero-cost-llm-optional.md)
- **Date:** 2026-06-21
- **Related:** [03-AGENT-ARCHITECTURE](../03-AGENT-ARCHITECTURE.md), [09-DEPLOYMENT](../09-DEPLOYMENT.md)

> **Superseded.** The $0-cost constraint removed the LLM fleet (see
> [ADR-0006](0006-zero-cost-llm-optional.md)). With no LLM, the refresh is a short deterministic
> batch job that runs on **GitHub Actions** — no always-on worker is needed. This record is kept
> for history; the reasoning below about serverless time limits is what motivated moving the (now
> deterministic) refresh off the request path in the first place.

## Context

Data is gathered by a **multi-agent fleet** (Claude Agent SDK, TypeScript): an Orchestrator fanning
out to domain source agents, plus extraction, scoring, critic, synthesis, editor, and watchdog
agents. A full refresh cycle — many parallel source fetches, LLM extraction, cross-checking, and
synthesis — can run for **minutes**, well beyond typical serverless function time limits. The site
itself is on Vercel and must stay fast and cheap to serve.

## Decision

Split hosting:

- **Vercel** hosts the Next.js site, edge read-APIs, SSE, ISR/PPR, and **Vercel Cron** (which only
  *triggers* refreshes).
- A **dedicated always-on worker** (Railway / Fly / Render) runs the agent fleet, consuming jobs
  from a Redis queue and writing results to Atlas + Redis.

Cron POSTs a trigger to the worker's `/enqueue`; the worker does the long-running work; the site
reads precomputed snapshots.

## Consequences

- Long agent runs are unconstrained by serverless limits.
- Clean separation: the fast, cheap read tier scales with traffic; the worker's cost scales with
  **cadence**, not traffic ([12-COST-MODEL](../12-COST-MODEL.md)).
- All source/Anthropic secrets are isolated to the worker, never near the browser.
- Operating two deploy targets instead of one — accepted; both are simple and stateless-ish, with
  state in Atlas/Redis.

## Alternatives considered

- **All on Vercel** (Functions + Cron + Queues) — rejected: function duration/concurrency limits
  make long fleet runs fragile.
- **Fully external agent service**, Vercel serves only snapshots — viable, but more moving parts than
  the hybrid; the worker already provides the needed separation.
- **Python runtime for agents** — rejected for v1: TypeScript matches the web stack and shares types
  via `packages/shared`; a Python sidecar can be added later if a connector needs heavy data/ML.

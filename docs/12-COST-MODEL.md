# 12 — Cost Model ($0 on free tiers)

> Reflects [ADR-0006](adr/0006-zero-cost-llm-optional.md). The default build has **no recurring
> cost and no LLM**. This document explains why, and what the (optional) paid upgrades would be.

## The headline: it's free

| Component | Service | Tier | Cost |
|-----------|---------|------|------|
| Scheduler + compute | GitHub Actions | Free (public: unlimited; private: 2,000 min/mo) | **$0** |
| Storage (time-series) | Git repo (committed JSON) | Free | **$0** |
| Hosting + CDN | Vercel Hobby (or Cloudflare/GitHub Pages) | Free | **$0** |
| Data sources | Free structured APIs (free keys where needed) | Free | **$0** |
| LLM | None (deterministic pipeline) | — | **$0** |
| **Total** | | | **$0 / month** |

## Why there's no LLM cost

[ADR-0005](adr/0005-determinism-boundary.md) already put the date computation in deterministic code.
The LLM's only remaining jobs were extraction, verification, narrative, and event detection — all
replaced by free deterministic logic ([ADR-0006](adr/0006-zero-cost-llm-optional.md),
[03-AGENT-ARCHITECTURE](03-AGENT-ARCHITECTURE.md)):

- **Structured sources** → connectors parse JSON/CSV directly; no LLM extraction.
- **Validation** → zod + range/cross-source/outlier rules; no LLM critic.
- **Narrative** → templated movers copy; no LLM synthesis.
- **Events** → curated JSON + structured feeds; no LLM detection.

Result: the entire default pipeline is deterministic and costs nothing to run.

## Why there's no infra cost

- **No always-on worker** — the refresh is a short batch job on free GitHub Actions cron.
- **No managed database** — JSON committed to the repo; git is the (free, versioned) time-series.
- **No Redis** — the hot path is a static JSON file on the free edge CDN.
- **Traffic doesn't add cost** — visitors read static, cached JSON; a spike is just CDN cache hits
  within the free tier.

## Staying inside the free tiers

| Limit | Headroom strategy |
|-------|-------------------|
| GitHub Actions minutes (private repos: 2,000/mo) | Job runs ~1–3 min; even hourly ≈ 720 runs ≈ well within budget. Public repo = unlimited. |
| GitHub Actions cron frequency | Hourly is reliable; don't rely on sub-hourly precision (best-effort). Cadence tiers keep most domains daily/weekly. |
| Vercel Hobby bandwidth/builds | Static JSON + CDN caching keeps bandwidth low; commits are batched per refresh, not per datapoint. |
| Source rate limits | Connectors respect documented limits; cadence selection avoids over-fetching ([04-DATA-SOURCES](04-DATA-SOURCES.md)). |
| Repo size (committed data) | Use a dedicated `data` branch and/or downsample old raw samples into daily aggregates. |

## Optional paid upgrades (all off by default)

You can spend money later for nicer properties, but nothing here is required:

| Want | Optional upgrade | Rough cost |
|------|------------------|-----------|
| Sub-hourly / real-time refresh | A tiny always-on worker (Fly/Railway) + Upstash Redis pub/sub for SSE | low |
| Richer extraction of unstructured sources (capex, funding from press) | Enable the optional `packages/llm` module with an Anthropic key (Haiku-tier, gated by env flag) | usage-based, small |
| Larger/queryable history | MongoDB Atlas M0 (free) → paid tier only if you outgrow it | $0 → low |
| Paid data feeds (Crunchbase/PitchBook/Similarweb) | Add as enrichment with curated fallback | varies |

Each upgrade is **isolated** (a swappable adapter or an env-gated module), so the free build stays
the baseline and nothing breaks if a paid option is turned off.

## Cost observability

Because there's no per-run billing to track in the free build, "cost observability" is simply the
free GitHub Actions run history (duration, success/failure) and Vercel's usage dashboard — both
free ([10-OBSERVABILITY](10-OBSERVABILITY.md)). If the optional LLM module is ever enabled, it logs
tokens/USD per run so spend stays visible.

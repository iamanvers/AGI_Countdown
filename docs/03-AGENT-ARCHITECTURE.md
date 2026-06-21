# 03 — Refresh Pipeline (deterministic; LLM-optional)

> Reflects [ADR-0006](adr/0006-zero-cost-llm-optional.md). The **default build uses no LLM** — the
> refresh is a deterministic batch pipeline that runs free on GitHub Actions cron. The multi-agent
> LLM fleet described at the end is an **optional, off-by-default** enhancement.

## Doctrine

> **Structured data in, deterministic stages process it, the engine computes the date.**

This is the same determinism boundary as before ([ADR-0005](adr/0005-determinism-boundary.md)) — we
simply replaced the four LLM jobs (extraction, verification, narrative, event detection) with free
deterministic logic. Nothing about the engine math changes.

## The pipeline (default, $0)

One script, `apps/pipeline`, invoked by GitHub Actions per cadence tier
([09-DEPLOYMENT](09-DEPLOYMENT.md)). Stages:

```
1. FETCH      → connectors pull free structured sources (JSON/CSV/API)
2. VALIDATE   → zod schemas + range / cross-source / outlier checks   (replaces the "Critic")
3. SCORE      → normalize + signed EWMA momentum per factor
4. COMPUTE    → packages/engine: deterministic T_AGI, progress%, band, movers
5. NARRATE    → templated movers copy from the numbers              (replaces "Synthesis prose")
6. CURATE     → merge curated events + structured feeds into timeline (replaces "Editor")
7. WRITE      → emit public/data/*.json + append estimate_history   (commit → deploy)
```

Every stage is pure/deterministic and finishes in seconds. No always-on process, no model calls.

### Stage detail

| Stage | What it does | How (free, deterministic) |
|-------|--------------|---------------------------|
| **Fetch** | Get current values per source | `packages/sources` connectors against free structured endpoints; per-source rate budgets; staleness flags |
| **Validate** | Reject bad data before it reaches the math | zod schema; per-factor min/max bounds; cross-source agreement thresholds; z-score outlier rejection → quarantine + flag |
| **Score** | Turn raw values into engine inputs | normalize (z-score / 0–1), apply `sign`, EWMA-smooth against history read from prior JSON ([05-DATA-MODEL](05-DATA-MODEL.md)) |
| **Compute** | The actual estimate | `engine.compute(samples)` → `EngineState` (pure TS, unit-tested) |
| **Narrate** | Human-readable "why it moved" | string templates: `"{factor} {±x%} → {±y} months"`, ranked by contribution |
| **Curate** | Keep the timeline current | merge `events.json` (curated) with structured feeds (GitHub releases, arXiv landmark IDs) by simple rules |
| **Write** | Persist + publish | write JSON snapshots; append `estimate_history`; git commit triggers redeploy |

### Validation = the deterministic "critic"

The Critic agent's job (keep hallucinated/bad data out of the engine) becomes explicit rules:

- **Schema**: every sample must validate against its zod type, with a citation, or it's dropped.
- **Bounds**: each factor declares plausible `[min, max]`; out-of-range ⇒ quarantine + flag.
- **Cross-source**: where two sources cover the same signal, disagreement beyond a threshold ⇒
  lower confidence / quarantine.
- **Outlier**: a value many σ from the factor's own recent history ⇒ quarantine (likely a feed
  error).

Quarantined samples are excluded from the blend and **visibly flagged** on the Sources page
([10-OBSERVABILITY](10-OBSERVABILITY.md), [11-SECURITY-LEGAL](11-SECURITY-LEGAL.md)) — same honesty
guarantee as before, now rule-based.

### Cadence-aware scheduling

| Tier | Examples | GitHub Actions cron |
|------|----------|---------------------|
| Hourly | Metaculus, Manifold, GDELT, news volume | `5 * * * *` |
| Daily | benchmark leaderboards, arXiv counts, GitHub, OpenRouter | `15 6 * * *` |
| Weekly/monthly | Epoch datasets, energy, funding, capex, AI Index, jobs reports | `30 6 * * 1` |

Each run processes only the due tier; slower factors carry momentum forward from the last JSON
snapshot. This keeps the job short and well inside free limits.

## Sources: structured-first

The default pipeline uses **free structured feeds only** — Metaculus, Manifold, Epoch CSV, GDELT,
arXiv, GitHub, EIA/Ember, OpenRouter, HF, BLS, O*NET, FRED, etc.
([04-DATA-SOURCES](04-DATA-SOURCES.md)). Signals that exist only in unstructured form (e.g., a capex
figure buried in a press release) are handled by a small **curated JSON** updated periodically, or
omitted — they are not allowed to require an LLM in the default build.

## Optional: the multi-agent LLM enhancement (off by default)

If you later add an Anthropic key and flip the env flag, an optional `packages/llm` module can
**augment** specific stages — it never replaces the engine and never becomes required:

| Stage | Optional LLM augmentation |
|-------|---------------------------|
| Fetch/Extract | Read unstructured pages (press releases, PDFs, earnings) → structured numbers for factors that have no clean API |
| Validate | A second-opinion check on borderline/contradictory samples |
| Narrate | Richer prose for the "why it moved" copy |
| Curate | Detect candidate timeline events from the news stream for human approval |

This is the original orchestrator-worker fleet (Orchestrator → domain agents → critic → synthesis →
editor), but as a **bolt-on**. Model tiering and budgets for that mode live in
[12-COST-MODEL](12-COST-MODEL.md). Because of the determinism boundary, enabling or disabling it
**does not change how the date is computed** — only how much unstructured coverage and prose polish
you get.

## State & provenance (unchanged guarantees)

- **`estimate_history`** — every run appends its `T_AGI` (the movement chart).
- **Per-factor provenance** — every sample records `sourceId`, `citation`, `confidence`, and
  whether it was quarantined.
- **Run record** — each GitHub Actions run is itself an audit log (inputs via committed diff,
  outcome via the JSON commit). See [10-OBSERVABILITY](10-OBSERVABILITY.md).

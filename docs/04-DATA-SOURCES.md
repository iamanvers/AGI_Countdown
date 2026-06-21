# 04 — Data Sources

> Reflects [ADR-0006](adr/0006-zero-cost-llm-optional.md): the default pipeline uses **free,
> structured feeds only** (free API key where needed, stored as a GitHub Actions secret). A source
> is `structured` (parsed deterministically — the default) or `curated` (a hand-maintained JSON
> value for signals that exist only as unstructured prose). Paid sources and LLM-assisted extraction
> of unstructured pages are **optional**, off by default.

The engine's credibility rests on its sources. The policy is **free/public/official first**, every
datapoint **cited**, and ToS/robots respected ([11-SECURITY-LEGAL](11-SECURITY-LEGAL.md)). Each
source is a typed entry in `packages/config/source-registry.ts`:

```ts
type SourceDef = {
  id: string;
  name: string;
  domain: string;                       // maps to a factor domain / connector group
  accessMethod: 'api' | 'scrape' | 'file' | 'feed';
  ingestion: 'structured' | 'curated';  // structured = parsed deterministically (default)
  authNeeded: boolean;                  // free API key / token required?
  cadence: 'hourly' | 'daily' | 'weekly' | 'monthly';
  rateLimit?: string;                   // documented limit, enforced via in-run counters
  tosNotes?: string;                    // attribution / usage constraints
  parser: string;                       // connector module in packages/sources
  url: string;
};
```

> Costs and ToS change. The registry is the single source of truth; this doc is the human-readable
> map. Anything marked **paid** has a **curated fallback** so the engine degrades, never breaks.

---

## AI progress / compute / benchmarks

| Source | Provides | Access | Cadence |
|--------|----------|--------|---------|
| **Epoch AI** | Notable-models DB, training compute (FLOP), data & parameter trends, algorithmic-efficiency, benchmarking hub | API / CSV | weekly |
| **Papers With Code** | SOTA benchmark leaderboards | scrape/API | daily |
| **HELM (Stanford CRFM)** | Holistic eval leaderboards | scrape/file | weekly |
| **LMArena (Chatbot Arena)** | Human-preference Elo leaderboard | API / HF | daily |
| **Hugging Face Hub** | Open LLM Leaderboard, trending models, downloads | API (HF skills available) | daily |
| **ARC Prize** | ARC-AGI / ARC-AGI-2 leaderboard | scrape/API | daily |
| **METR** | Autonomy time-horizon (task-length-doubling) evals | file/scrape | monthly |
| **arXiv API** | Paper volume (cs.AI / cs.LG / cs.CL) | API | daily |
| **Semantic Scholar API** | Citations, paper graph | API (key) | daily |
| **GitHub API** | Frontier-repo activity, stars, releases | API (token) | daily |
| **Stanford HAI AI Index** | Annual benchmark/economy datasets | file | monthly |

## Forecasts / markets

| Source | Provides | Access | Cadence |
|--------|----------|--------|---------|
| **Metaculus API** | Community predictions on AGI/TAI questions (definition-matched) | API | daily |
| **Manifold API** | Market-implied AGI probabilities | API | hourly |
| **Polymarket / Kalshi** | AI-related markets (where available) | API | hourly |
| **AI Impacts** | Expert-survey timeline data | file | monthly |

## Labs / economics / funding / adoption

| Source | Provides | Access | Cadence |
|--------|----------|--------|---------|
| **Hyperscaler earnings / IR** (MSFT, GOOG, AMZN, META) | Capex, AI revenue commentary | file/scrape | monthly |
| **NVIDIA earnings** | Datacenter revenue (a compute-demand proxy) | file/scrape | monthly |
| **Datacenter / "Stargate"-class announcements** | Buildout scale | news/scrape | weekly |
| **OpenRouter** | Public model-usage rankings | API | daily |
| **a16z Top GenAI Apps** | Consumer/prosumer adoption ranking | file | monthly |
| **App-store ranks** | Assistant app adoption | scrape | daily |
| **Crunchbase** *(paid, optional)* | Funding rounds | API | weekly |
| **PitchBook** *(paid, optional)* | Valuations | file | monthly |
| **Similarweb** *(paid/limited)* | Web traffic to AI apps | API | weekly |

## Energy / hardware

| Source | Provides | Access | Cadence |
|--------|----------|--------|---------|
| **IEA** | Electricity & datacenter demand reports | file | monthly |
| **Ember** | Electricity generation data | API | weekly |
| **EIA** | US energy data | API (free key) | weekly |
| **TSMC** | Foundry capacity (earnings) | file/scrape | monthly |
| **BIS (US Commerce)** | Export-control notices on chips | feed/scrape | weekly |

## Policy / regulation

| Source | Provides | Access | Cadence |
|--------|----------|--------|---------|
| **OECD.AI Policy Observatory** | National AI policies | API | weekly |
| **EU AI Act timeline** | Regulatory milestones | scrape/file | weekly |
| **NIST** | AI risk frameworks, guidance | feed | monthly |
| **US Executive Orders / legislative trackers** | Federal & state AI law | feed/scrape | weekly |
| **AI Safety Summit outcomes** | International commitments | file | monthly |

## Sentiment / backlash

| Source | Provides | Access | Cadence |
|--------|----------|--------|---------|
| **GDELT** | News tone & volume by AI theme (large, free) | API | hourly |
| **NewsAPI / Mediastack** | Headlines & coverage volume | API (key) | hourly |
| **Pew Research** | Public-opinion polls on AI | file | monthly |
| **YouGov** | Sentiment polling | file/scrape | monthly |
| **AIPI (AI Policy Institute)** | AI-attitude polls | file | monthly |

## Jobs / automation

| Source | Provides | Access | Cadence |
|--------|----------|--------|---------|
| **O*NET** | Occupation tasks/skills taxonomy | file/API | monthly |
| **BLS / OEWS** | Employment & wages by occupation | API (free) | monthly |
| **OECD employment** | Automation-risk studies | file | monthly |
| **ILO** | Global labor / GenAI exposure | file | monthly |
| **WEF Future of Jobs** | Job creation/displacement projections | file | monthly |
| **McKinsey / MGI** | Automation potential studies | file | monthly |
| **OpenAI "GPTs are GPTs"** | Occupation LLM-exposure scores | file | monthly |
| **Frey & Osborne** | Computerization-risk baseline | file | monthly |
| **Anthropic Economic Index** | Claude usage by occupation/task (free, highly relevant) | file/API | monthly |
| **PwC AI Jobs Barometer** | AI-exposed wage/skill trends | file | monthly |
| **LinkedIn / Indeed Hiring Lab** | Emerging-jobs & hiring trends | file/scrape | monthly |

---

## Sourcing strategy notes

- **Official APIs over scraping** wherever one exists; scraping only for sources without an API, and
  always within robots/ToS.
- **Attribution everywhere** — the Sources page lists every feed with its last-fetch time and
  health; each sample carries its citation through to the UI.
- **Rate-limit budgets** are enforced with in-run counters keyed by source id; cadence selection
  keeps requests within documented limits.
- **Paid sources are optional** — the engine treats them as enrichment with a curated fallback, so
  the core estimate never depends on a paywall.
- **Source health is first-class** — a stale/failed source is excluded from the blend and flagged,
  not silently dropped (see [10-OBSERVABILITY](10-OBSERVABILITY.md)).

Mapping back to factors: each `FactorDef.sources[]` in
[02-CLOCK-ENGINE](02-CLOCK-ENGINE.md) references `SourceDef.id`s from this registry, and each
`SourceDef.domain` maps to a connector group / pipeline stage in
[03-AGENT-ARCHITECTURE](03-AGENT-ARCHITECTURE.md).

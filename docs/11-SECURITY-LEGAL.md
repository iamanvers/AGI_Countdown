# 11 — Security, Legal & Attribution

The product makes a bold, speculative claim (a date for AGI). It stays credible and defensible only
by being **transparent, well-sourced, and honest about uncertainty** — and by handling third-party
data and secrets responsibly.

## Honest framing (the most important "legal" control)

- The date is presented as an **estimate / aggregator**, never as fact. The UI **always** shows the
  `confidenceBand` and the `MoversList` rationale.
- **No false precision.** A range is always visible; the methodology page shows the exact formula,
  weights, and anchor sources ([02-CLOCK-ENGINE](02-CLOCK-ENGINE.md)).
- **Multiple definitions** of AGI are offered, and the forecast **spread** is shown — the site
  surfaces disagreement rather than hiding it.
- A clear **disclaimer** on `/about`: not financial, investment, or professional advice; an
  exploratory model, not a prediction of record.

## Source attribution & compliance

- **Every datapoint is cited.** `FactorSample.citation` flows through to `SourceBadge`s in the UI
  and to the Sources page.
- **Prefer official APIs.** Scrape only where no API exists, and only within the site's
  `robots.txt` and Terms of Service. The **Health/Watchdog agent** monitors compliance
  ([03-AGENT-ARCHITECTURE](03-AGENT-ARCHITECTURE.md)).
- **Respect rate limits.** Per-source budgets are enforced via Redis counters; cadence selection
  keeps request volume within documented limits.
- **Honor licensing.** Some sources (e.g., reports, datasets) permit derived metrics with
  attribution but not redistribution of raw content — we store/derive **metrics and links**, not
  wholesale copies, and attribute the origin.
- **Paid sources** are optional enrichment with curated fallbacks; the core estimate never depends
  on redistributing paywalled data.

## Secrets management

> Reflects [ADR-0006](adr/0006-zero-cost-llm-optional.md): the only secrets are **free** API keys,
> stored as **GitHub Actions secrets** and used solely inside the pipeline run.

| Secret | Where it lives | Never |
|--------|----------------|-------|
| Free source API keys (EIA, BLS, Semantic Scholar, …) | GitHub Actions secrets | Never in the browser or web bundle |
| Anthropic API key *(only if the optional LLM module is enabled)* | GitHub Actions secret | Never client-exposed |

- All third-party calls originate in the **pipeline** (GitHub Actions); the web app ships **no
  secrets** and only reads public static JSON ([06-API](06-API.md), [09-DEPLOYMENT](09-DEPLOYMENT.md)).
- No secret is ever sent to the client or embedded in server components' serialized props.
- Many sources need **no key at all** (Metaculus, Manifold, arXiv, GDELT, GitHub public, Epoch CSV,
  OpenRouter, HF public).

## Web application security

- **Static, read-only public site** — there are **no write endpoints**; the only writer is the
  GitHub Actions pipeline committing to the repo. This removes a whole class of attack surface.
- **Input validation** with zod at the pipeline boundary; unknown `definition` values rejected.
- Standard headers (CSP, HSTS, etc.) and dependency hygiene (lockfile, `npm audit`/Dependabot in CI).
- **PII**: the site collects none by design; analytics are aggregate (Vercel Analytics, free tier).

## Data-quality safety (anti-misinformation)

Because the system republishes a synthesized claim, it must guard against amplifying bad data:

- The **deterministic validator** (zod + bounds + cross-source + outlier rules) quarantines
  implausible or low-confidence samples before they reach the engine
  ([03-AGENT-ARCHITECTURE](03-AGENT-ARCHITECTURE.md)).
- **Bounded `Δ_factors`** caps how far any data (good or bad) can move the date.
- **Full provenance + git history** means any published number can be explained, and any past state
  reconstructed (`git log`) and corrected with a visible trail.
- The **estimate-history chart** makes the model's own track record public — including its misses.

## Accessibility as a requirement

A11y is treated as part of "legitimate and responsible," not optional: full reduced-motion path,
keyboard navigation, AA contrast, and assistive-tech-friendly live updates
([07-FRONTEND-DESIGN](07-FRONTEND-DESIGN.md)).

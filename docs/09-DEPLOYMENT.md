# 09 — Deployment (zero-cost / free tiers)

> Reflects [ADR-0006](adr/0006-zero-cost-llm-optional.md): the project runs at **$0** with no
> always-on worker, no Redis, and no managed database in the default build.

The whole system is three free things:

1. **GitHub Actions** — scheduled cron that runs the deterministic refresh pipeline.
2. **The repo itself** — JSON snapshots committed by the pipeline; git history is the time-series.
3. **Vercel Hobby** (free) — serves the Next.js site + static JSON from the edge CDN.

```
   GitHub Actions (cron, free)                         Vercel Hobby (free)
   ┌──────────────────────────────┐                    ┌───────────────────────────┐
   │ on schedule (hourly/daily/wk)│                     │ Next.js (RSC / ISR)        │
   │  run apps/pipeline:           │                    │ reads /data/*.json (CDN)   │
   │   1. fetch free structured    │   commit JSON      │ clock animates locally,    │
   │      sources                  │  ───────────────▶  │ revalidates on cadence     │
   │   2. validate (zod+rules)     │   to repo / data    │                           │
   │   3. engine.compute()         │   branch → deploy   │                           │
   │   4. template movers copy     │                    └───────────────────────────┘
   │   5. write public/data/*.json │                              ▲
   └──────────────┬───────────────┘                               │ git push triggers
                  │ git push                                       │ Vercel auto-deploy / ISR
                  └───────────────────────────────────────────────┘
```

No request a visitor makes ever runs the pipeline; they read static JSON from the CDN.

## 1. Scheduler + compute — GitHub Actions

Free and flexible (public repos: unlimited minutes; private: 2,000 min/mo — our job runs in ~1–3
min). One workflow per cadence tier, or one workflow that decides what's due.

```yaml
# .github/workflows/refresh-hourly.yml
name: refresh-hourly
on:
  schedule:
    - cron: '5 * * * *'          # hourly (best-effort; GitHub may delay under load)
  workflow_dispatch: {}           # manual trigger
permissions:
  contents: write                 # to commit JSON snapshots
jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: corepack enable && pnpm install --frozen-lockfile
      - run: pnpm --filter pipeline run refresh -- --cadence hourly
        env:
          EIA_API_KEY:   ${{ secrets.EIA_API_KEY }}     # free keys, optional
          BLS_API_KEY:   ${{ secrets.BLS_API_KEY }}
          # ...other free keys as needed
      - name: commit snapshots
        run: |
          git config user.name  "agi-countdown-bot"
          git config user.email "bot@users.noreply.github.com"
          git add apps/web/public/data
          git commit -m "data: refresh $(date -u +%FT%TZ)" || echo "no changes"
          git push
```

- **Cadence tiers:** `refresh-hourly` (Metaculus/Manifold/GDELT/news), `refresh-daily`
  (benchmarks/arXiv/GitHub/OpenRouter), `refresh-weekly` (Epoch/energy/funding/jobs).
- **Free API keys** (EIA, BLS, Semantic Scholar, optional NewsAPI) live in **GitHub Actions
  secrets** — free. Many sources need no key at all.
- `workflow_dispatch` lets you trigger a refresh by hand anytime.

> **Git churn:** to keep the main branch clean, write snapshots to a dedicated **`data` branch**
> (or a separate data repo) and point Vercel/ISR at it. Either works; the `data` branch is the
> tidiest.

## 2. Storage — committed JSON (the repo is the database)

The pipeline writes a small set of JSON files (see [05-DATA-MODEL](05-DATA-MODEL.md)):

```
apps/web/public/data/
  engine_state.<definition>.json   # latest snapshot the site renders
  estimate_history.json            # append-only T_AGI series (the movement chart)
  factors.json                     # current factor values + momentum + citations
  timeline.json                    # curated + structured events
  jobs.json                        # automation % + emerging jobs
  sources.json                     # registry + health/last-fetch
```

Git history gives durable, versioned, free time-series — you can `git log` any past state. **No
Atlas, no Redis, no Postgres required.**

**Optional free upgrade:** if file size ever becomes awkward, swap the storage adapter for
**MongoDB Atlas M0** (free 512 MB) or **Turso/Supabase** free tiers — the pipeline writes through a
small repository interface, so this is a localized change.

## 3. Delivery — Vercel Hobby (free)

| Concern | Setup |
|---------|-------|
| Framework | Next.js App Router; static/ISR pages reading `/data/*.json` from the CDN |
| Hosting | **Vercel Hobby** — free, global edge CDN, auto-deploy on push |
| Updates | A pipeline commit triggers a redeploy (or on-demand ISR revalidate) |
| Live feel | Clock animates locally (rAF); client revalidates JSON on cadence — no Redis, no SSE |
| Insights | Vercel Speed Insights / Analytics (free Hobby quota) |

**Alternatives (also free):** **Cloudflare Pages** or **GitHub Pages** with `next export` for a
fully static build — use these if you prefer to avoid even Hobby limits. The site is static + JSON,
so it ports easily.

## Secrets & isolation

- Only **free** API keys, stored as **GitHub Actions secrets** (used only inside the pipeline run).
- The web app ships **no secrets** — it reads public static JSON.
- If the optional LLM enhancement is ever enabled, its key is a GitHub Actions secret too, gated by
  an env flag (off by default).

## CI/CD

- **GitHub → Vercel:** preview deploy per PR; production on merge to the default branch.
- **Pipeline runs** are themselves GitHub Actions — logs and run history are free and built-in
  ([10-OBSERVABILITY](10-OBSERVABILITY.md)).
- **Gates** before merge: type-check, lint, engine unit tests, connector contract tests, and
  Lighthouse CI budgets ([14-TESTING](14-TESTING.md)).

## What this costs

**$0.** GitHub Actions (free tier), Vercel Hobby (free), repo storage (free). No worker, no Redis,
no database, no LLM. See [12-COST-MODEL](12-COST-MODEL.md).

```
   █████╗  ██████╗ ██╗    ██████╗ ██████╗ ██╗   ██╗███╗   ██╗████████╗██████╗  ██████╗ ██╗    ██╗███╗   ██╗
  ██╔══██╗██╔════╝ ██║   ██╔════╝██╔═══██╗██║   ██║████╗  ██║╚══██╔══╝██╔══██╗██╔═══██╗██║    ██║████╗  ██║
  ███████║██║  ███╗██║   ██║     ██║   ██║██║   ██║██╔██╗ ██║   ██║   ██║  ██║██║   ██║██║ █╗ ██║██╔██╗ ██║
  ██╔══██║██║   ██║██║   ██║     ██║   ██║██║   ██║██║╚██╗██║   ██║   ██║  ██║██║   ██║██║███╗██║██║╚██╗██║
  ██║  ██║╚██████╔╝██║   ╚██████╗╚██████╔╝╚██████╔╝██║ ╚████║   ██║   ██████╔╝╚██████╔╝╚███╔███╔╝██║ ╚████║
  ╚═╝  ╚═╝ ╚═════╝ ╚═╝    ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═════╝  ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═══╝
```

```
╭──────────────────────────────────────────────────────────────────╮
│ ✻ AGI Countdown                                                    │
│                                                                    │
│   A deterministic, zero-cost live clock to AGI.                    │
│                                                                    │
│   pnpm dev          → run the site locally                         │
│   pnpm refresh      → recompute the snapshot from live data        │
│   /methodology      → see exactly how the date is built            │
│                                                                    │
│   stack: Next.js · TypeScript · Tailwind · GitHub Actions          │
│   cost:  $0  ·  no LLM required  ·  every number cited             │
╰──────────────────────────────────────────────────────────────────╯
```

A **Worldometer for AGI** — one large clock counting down to the current estimated arrival of
Artificial General Intelligence. The number is not a guess: a transparent, deterministic engine
blends public forecasts into a baseline date, then nudges it with bounded live signals. Everything
is cited, the uncertainty is always shown, and the whole thing runs for **$0**.

---

## How the clock works

```
T_AGI  =  Anchor  +  Δ_factors
```

- **Anchor** — a weighted blend of published forecasts (Metaculus community, prediction markets,
  expert surveys, compute-based models) → the slow-moving consensus date.
- **Δ_factors** — a live, bounded shift from signals like frontier-benchmark saturation, training
  compute, research velocity (arXiv), adoption, datacenter capex, energy headroom, policy friction,
  and public sentiment (GDELT). Each is normalized, signed, weighted, smoothed, and **clamped**.

> **The rule:** validated data goes in; a pure function computes the date. No model ever invents the
> number — see [`docs/adr/0005-determinism-boundary.md`](docs/adr/0005-determinism-boundary.md).

Three switchable definitions (**Weak AGI**, **Transformative AI**, **Strong AGI**) each get their own
anchor and clock.

---

## Quick start

```bash
corepack pnpm install          # install (pnpm workspace)
corepack pnpm refresh          # compute fresh snapshots from live + curated data
corepack pnpm dev              # run the site at http://localhost:3000
```

Other useful scripts:

| Command | What it does |
|---|---|
| `pnpm build` | Build every package + the Next.js site |
| `pnpm typecheck` | Type-check the whole workspace |
| `pnpm test` | Run unit tests (engine math is fully tested) |
| `pnpm refresh -- --cadence hourly` | Run only the hourly tier |
| `pnpm validate:data` | Validate the static JSON against the schemas |

---

## Triggering a refresh

The data updates on a schedule, but you can force a fresh run two ways:

1. **From the website** — the **Trigger refresh** button on the home page calls the
   [`/api/refresh`](apps/web/app/api/refresh/route.ts) route, which dispatches the on-demand GitHub
   Actions workflow. Configure it by setting `GITHUB_DISPATCH_TOKEN` and `GITHUB_REPOSITORY` (see
   [`.env.example`](.env.example)); without them the button explains it's not configured and the
   scheduled refreshes still run.
2. **From GitHub** — run the **Refresh (on-demand)** workflow manually, or wait for the hourly /
   daily / weekly schedules in [`.github/workflows`](.github/workflows).

---

## Architecture (zero-cost)

```
GitHub Actions (cron / on-demand)                 Vercel (free) / any static host
┌─────────────────────────────────────┐           ┌──────────────────────────────┐
│ apps/pipeline:                       │  commit   │ Next.js — reads /data/*.json │
│  fetch (live + curated)  →  validate │  JSON →   │ clock animates locally,      │
│  →  engine.compute()  →  write JSON  │ ───────→  │ revalidates on cadence       │
└─────────────────────────────────────┘           └──────────────────────────────┘
        live: Manifold · arXiv · GDELT                    no DB · no server · no LLM
```

No always-on worker, no database, no paid APIs. The request path just serves static JSON from the
edge; the time-series history *is* the git history.

### Project layout

```
apps/
  web/        Next.js site (clock, timeline, jobs, methodology, sources, about)
  pipeline/   deterministic refresh: fetch → validate → compute → write JSON
packages/
  engine/     pure TS estimator math (anchor blend, bounded Δ, band) — unit-tested
  sources/    live connectors (Manifold/arXiv/GDELT) + cited curated dataset
  config/     factor registry, AGI definitions, source registry
  validate/   zod schemas for every static data file
  shared/     shared types
docs/         architecture of record + ADRs
```

---

## Deployment

- **Site:** deploy `apps/web` to **Vercel** (Hobby) or any static host. Set `NEXT_PUBLIC_SITE_URL`
  to your canonical origin so metadata / Open Graph resolve correctly.
- **Data:** the GitHub Actions workflows commit refreshed JSON to the repo; the push redeploys the
  site. Add free API keys and the refresh-trigger token as repo / Vercel secrets if you want them.

See [`.env.example`](.env.example) for every (optional) variable.

---

## Honest by design

The projected date is an **estimate**, not a prediction of record. A confidence band is always
shown, failed sources are flagged rather than faked, and switching the AGI definition visibly moves
the date. The full method, factor table, and source health are public in the app and in
[`docs/`](docs/).

_Not financial, investment, or professional advice._

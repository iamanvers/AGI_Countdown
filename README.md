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

## Why this exists

"When will AGI arrive?" is one of the most consequential questions of our era — and the answer is
usually a shrug, a hot take, or a sales pitch. AGI Countdown replaces that fog with **one honest,
transparent number that updates as the world actually changes.**

Most predictions are a single confident date from a single confident person — no reasoning, no
uncertainty, never updated. This is the opposite: a clock you can interrogate. It starts from what
forecasters, prediction markets, expert surveys, and compute-based models collectively expect, then
moves the date sooner or later as real signals change (benchmark results, training compute, capital,
energy limits, policy, sentiment). When the signals move, the clock moves; when the data is thin, the
uncertainty band widens. You can disagree with it *specifically* — open the
[methodology](docs/02-CLOCK-ENGINE.md) and every input, weight, and source is there.

It's deliberately **not hype and not doom**, it runs for **$0**, and **no AI model is required** to
produce the number.

## How the clock works

```
T_AGI  =  Anchor  +  Δ_factors
```

- **Anchor** — a weighted blend of published forecasts (Metaculus, prediction markets, expert
  surveys, compute-based models): the slow-moving consensus date.
- **Δ_factors** — a live, *bounded* shift from ~19 signals (benchmark saturation, training compute,
  autonomy, capital formation, energy, policy, sentiment, robotics, macro risk, the data wall,
  frontier release cadence, …),
  weighted differently **per AGI definition** and EWMA-smoothed so the date glides instead of jumping.
  It's a **directional** model: accelerators only ever pull the date *sooner*, decelerators only ever
  push it *later* (an early/weak headwind is amplified, never flipped). Each factor is normalized
  against its **own rolling history** (z-score / empirical percentile), so the date moves on momentum
  rather than static constants. The three modes (Weak / Transformative / Strong) get distinct dates,
  capability levels, and movers.

The arrival is shown as a **range**, not a false-precision timestamp: a coarse central estimate
(e.g. "≈ Q2 2031") plus a **self-adjusting ±σ confidence band** (±1σ likely / ±2σ outer) that
tightens when the date is near and signals agree, and widens when it's far or noisy — while the live
counter still ticks down.

> **The one rule:** validated data goes in; a pure function computes the date. No model ever invents
> the number — see [`docs/adr/0005-determinism-boundary.md`](docs/adr/0005-determinism-boundary.md).

Around the clock: **~140 cited sources** (live signal feeds + a tiered reference catalog), a live
**news feed** + curated **milestones**, a **jobs & automation** breakdown by sector *and region* with
**revenue-at-risk**, an interactive **engine flow graph** and **"what would change the date?"**
scenario explorer, a **track record** of how the estimate has moved, a fully transparent
**methodology** page, and a **[/developers](apps/web/app/developers/page.tsx)** JSON API + embeddable
**badge**. Every page link unfurls with a live **Open Graph** card.

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
        live: Manifold·arXiv·GDELT·GitHub·HF·FRED         no DB · no server · no LLM
```

No always-on worker, no database, no paid APIs. The request path just serves static JSON from the
edge; the time-series history *is* the git history.

### Project layout

```
apps/
  web/        Next.js site (clock, timeline, jobs, methodology, sources, developers, about)
  pipeline/   deterministic refresh: fetch → validate → compute → write JSON
packages/
  engine/     pure TS estimator math (anchor blend, bounded Δ, band) — unit-tested
  sources/    live connectors (Manifold/arXiv/GDELT/GitHub/HF) + cited curated dataset
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

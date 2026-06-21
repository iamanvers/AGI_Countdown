# 08 — Performance (extremely fast, async)

Performance is a product feature, not an afterthought. The site must feel **instant**, and the
clock must feel **alive** at all times — even before any network response arrives.

## The one move that makes it fast

> **The request path does zero heavy compute.** All fetching and engine recomputation happen on a
> schedule in the GitHub Actions pipeline; a user request reads a single precomputed **static JSON**
> snapshot from the edge CDN.

There is no per-request compute, no LLM call, no database query in the hot path. Under a traffic
spike, the cost per request is "serve one small cached JSON file and stream HTML" — entirely within
free-tier CDN limits. See [01-ARCHITECTURE](01-ARCHITECTURE.md) and [06-API](06-API.md).

## Rendering strategy

| Technique | Why |
|-----------|-----|
| **React Server Components** | Ship HTML with the initial snapshot inlined; minimal client JS |
| **Streaming SSR + Suspense** | The static shell paints immediately; data-dependent regions stream in |
| **Partial Prerendering (PPR)** | A prerendered shell from the CDN + dynamic holes filled at the edge — instant first paint with live data |
| **Client islands** | Only interactive bits (clock, toggles, charts) hydrate; the rest stays static |

## The clock never waits on the network

- On load, the clock **hydrates from the inlined snapshot** and starts animating via
  `requestAnimationFrame` — sub-second motion runs entirely on the client.
- Secondary odometers (compute/sec, papers/day, $/sec) are **extrapolated locally** from the
  snapshot's rates, so they keep moving with zero further requests.
- New data is picked up by **re-fetching the static JSON on cadence** (matched to the refresh tier);
  the clock **eases** to the new target.
- If the network is slow or offline, the clock keeps ticking toward the last known `T_AGI`.

This decoupling — local animation, cadence-paced corrections — is what makes the experience feel
both instant and live, with no server push needed.

## Caching layers

1. **CDN edge cache** with `stale-while-revalidate` — serves the static JSON/HTML instantly and
   revalidates in the background.
2. **Build-time inlining** — RSC/ISR embeds the latest snapshot into the HTML, so the clock is
   meaningful on first paint with no client round-trip.
3. **ISR** for content pages (`/timeline`, `/jobs`, `/methodology`, `/sources`), revalidated when the
   pipeline commits new JSON.
4. **Static `public/data/*.json`** is the canonical hot source — no Redis, no database in the path.

## Asset & bundle discipline

- **Route-level code splitting**; the home route ships the minimum needed for the clock.
- **Lazy-load** charts (`EstimateHistoryChart`, automation charts) and the optional WebGL hero via
  `next/dynamic`.
- **`next/font`** (self-hosted, `font-display: swap` tuned) — no FOUT, no layout shift; the mono
  numerals are subset to digits + glyphs actually used.
- **`next/image`** with explicit dimensions — zero layout shift.
- **Preconnect / priority hints** for the data origin and critical assets.
- **Minimal client JS budget** per route; the heavy logic lives in the pipeline, not the browser.

## Live updates without a server

The estimate only changes when the cron pipeline runs, so clients simply **re-fetch the static JSON
on cadence** (e.g., every few minutes) and ease the clock to any new target. No SSE, no worker, no
Redis — and because the file is CDN-cached, these revalidation fetches are cheap. An optional
realtime (SSE) path exists but is off by default ([06-API](06-API.md), [12-COST-MODEL](12-COST-MODEL.md)).

## Budgets & gates (CI-enforced)

| Metric | Target |
|--------|--------|
| **LCP** | < 1.5s |
| **INP** | < 200ms |
| **CLS** | ≈ 0 |
| **TTFB** (edge, cached) | < 100ms |
| Home-route JS | Strict per-route budget; regressions fail CI |

- **Lighthouse CI** runs on every PR; budget regressions block merge.
- **Vercel Speed Insights + Analytics** track field (real-user) Core Web Vitals in production.
- The optional WebGL backdrop is **performance-gated**: disabled under reduced-motion, low-power, or
  if it threatens the LCP budget.

## Why this scales

Because the expensive work is amortized across all visitors (computed once per refresh, read by
everyone) and served as static files from the edge CDN, the marginal cost of an additional visitor
is ~zero. Pipeline cost is bounded by **cadence**, not by traffic — and on free tiers it is **$0**
([12-COST-MODEL](12-COST-MODEL.md)).

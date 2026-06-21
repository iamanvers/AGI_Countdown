# 07 — Frontend & Design System

Stack: **Next.js (App Router) + TypeScript + Tailwind + Framer Motion**. The aesthetic is
minimalist and fluid; the engineering goal is that it feels **instant** (see
[08-PERFORMANCE](08-PERFORMANCE.md)).

## Design north star

> Quiet, precise, and alive. A lot of empty space, one big honest number, motion that feels
> physical. Nothing decorative competes with the clock.

### Tokens

| Token | Direction |
|-------|-----------|
| **Type** | Variable grotesk sans for copy (e.g. Geist/Inter); a precise **monospace** for all numerals so digits don't jitter as they change |
| **Palette** | Near-black / near-white base; a single accent that **warms** (cool → amber → red) as `T_AGI` approaches |
| **Space** | Generous, asymmetric negative space; wide margins; few elements per viewport |
| **Texture** | Faint grain + subtle gradient on the hero only; never busy |
| **Density** | Low. Progressive disclosure — depth lives on Methodology, not the home hero |
| **Modes** | Dark and light, both first-class; WCAG AA contrast |

### Motion language

- **Springs over easings** for anything physical (the clock easing to a new target, panels
  entering).
- **Odometer / number-flip** for the counter and sub-counters — digits roll, they don't pop.
- **Scroll-linked reveals** for sections below the hero (Framer Motion `useScroll`).
- **Eased estimate transitions** — when a new `engine_state` arrives, the date glides; it never
  snaps.
- **`prefers-reduced-motion`** — a complete alternate path: discrete updates, no sub-second
  animation, no parallax. Accessibility is not optional.

## Pages

| Route | Contents |
|-------|----------|
| `/` (The Clock) | Hero `CountdownClock` + `ProgressMeter` + `ConfidenceBand`; live sub-counters; `MoversList` ("top movers today"); `DefinitionToggle`; scroll-reveal into summary panels |
| `/timeline` | `TimelineRail` — interactive, zoomable major-events rail |
| `/jobs` | `AutomationPanel` (overall % + by sector/occupation) + `EmergingJobsList` |
| `/methodology` | The formula, the factor registry + weights, anchor sources, and `EstimateHistoryChart` ("how the date has moved") |
| `/sources` | Attributed source directory + `SourceHealthBoard` |
| `/about` | Vision + the honest disclaimer |

## Component inventory

| Component | Notes |
|-----------|-------|
| `CountdownClock` | Canvas/SVG, sub-second, driven by local `requestAnimationFrame`; never waits on network |
| `ProgressMeter` | 0–100 capability meter; smooth arc/bar |
| `ConfidenceBand` | Fuzzy range around the date, communicating uncertainty |
| `FactorTicker` | Live odometers (compute/sec, papers/day, $/sec) extrapolated client-side |
| `MoversList` | Ranked factors that moved the date + their rationale + citation |
| `EstimateHistoryChart` | Time series of past `T_AGI` (lazy-loaded chart) |
| `TimelineRail` | Zoomable events rail; keyboard-navigable |
| `AutomationPanel` | Sector/occupation automation %, sourced & cited |
| `EmergingJobsList` | New roles with demand signal + source |
| `SourceBadge` | Inline citation chip; links to the Sources page |
| `StalenessTag` | Honest "data catching up" indicator when `stale: true` |
| `DefinitionToggle` | Switches AGI definition; date visibly shifts |
| `SourceHealthBoard` | Per-source last-fetch + status |

## Rendering approach

- **React Server Components** render the static shell and inject the initial `engine_state` so the
  page is meaningful on first paint.
- **The clock is a client island** — small, focused; it hydrates from the injected snapshot and
  starts animating immediately.
- **Charts and the optional WebGL hero are lazy-loaded** (`next/dynamic`) so they never block first
  paint.
- **Optional react-three-fiber / shader backdrop** on the hero for the "beautiful render," strictly
  within the performance budget and disabled under reduced-motion / low-power.

## Accessibility

- Full `prefers-reduced-motion` path; the countdown remains legible and updates discretely.
- Keyboard navigation for the timeline and toggles; visible focus states.
- AA contrast in both themes; the warming accent never becomes the sole carrier of meaning.
- Semantic landmarks; the live number exposed politely to assistive tech (no spammy `aria-live`).

## Honest-by-design UI

The interface always communicates that the date is an **estimate**: the `ConfidenceBand` is always
visible, `MoversList` explains *why* it moved, every figure carries a `SourceBadge`, and the
`DefinitionToggle` makes the dependence on definition tangible. This honesty is a design feature,
not a footnote ([11-SECURITY-LEGAL](11-SECURITY-LEGAL.md)).

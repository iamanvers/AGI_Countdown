# 00 — Overview & AGI Definitions

## Vision

**AGI Countdown** is a single, arresting artifact: a giant clock counting down to Artificial General
Intelligence. Where Worldometer extrapolates *known* rates (births, deaths, CO₂), AGI has no agreed
arrival rate — so the headline number is an **estimate that the site continuously recomputes** from
the live state of the world. The product's value is the combination of:

1. **A beautiful, credible live countdown** — fluid, minimalist, emotionally resonant.
2. **A transparent engine** — anyone can open the methodology and see exactly which signals moved
   the date and by how much.
3. **A comprehensive evidence base** — dozens of legitimate sources, gathered automatically by a
   multi-agent fleet, each datapoint cited.

The site is opinionated but honest: it never pretends to *know* when AGI arrives. It shows a
**range**, the **assumptions**, and the **forecast spread**, and lets the visitor change the
definition of AGI and watch the date move.

## Product surface

| Surface | Purpose |
|---------|---------|
| **The Clock** (home) | Hero countdown, progress meter, confidence band, live sub-counters, "top movers today," definition toggle |
| **Timeline** | Interactive rail of major AI/AGI events, auto-detected from the news stream + lightly curated |
| **Jobs & Automation** | Overall % automation + breakdown by sector/occupation; emerging-jobs list |
| **Methodology** | The full formula, factor registry, weights, anchor sources, and the estimate-history chart ("how the date has moved") |
| **Sources** | Attributed directory of every feed with last-fetch time and health status |
| **About** | Vision, disclaimer, the honest framing |

## Operationalizing "AGI" (the switchable target)

AGI timelines are contested largely because people mean different things by "AGI." Rather than
hide that, we make the target **explicit and switchable**. The engine exposes a `definition`
selector; each maps to a different forecast anchor and benchmark basket. The UI always shows which
definition is active and lets visitors toggle it — the projected date visibly shifts, which is both
honest and a compelling interaction.

| Definition | Meaning | Primary anchor |
|-----------|---------|----------------|
| **`weak-agi`** (default) | Matches expert humans across most economically valuable cognitive tasks; passes adversarial Turing tests | Metaculus "weak AGI" question |
| **`transformative-ai`** | AI that drives civilization-scale automation / growth acceleration | Cotra bio-anchors + Epoch compute-based models |
| **`strong-agi`** | Human-level across ~all cognitive domains, including robust autonomy | Metaculus "strong / general AI" question |

Each definition also selects a slightly different **benchmark basket** for the `progress%` meter
(e.g., `transformative-ai` weights economic-deployment signals more heavily than raw benchmark
saturation). See [02-CLOCK-ENGINE](02-CLOCK-ENGINE.md).

## Glossary

| Term | Meaning |
|------|---------|
| **`T_AGI`** | The projected AGI arrival datetime the clock counts down to |
| **`Anchor`** | Forecast-consensus baseline date, blended from prediction markets, surveys, and model-based timelines |
| **`Δ_factors`** | Net shift (in months) applied to the anchor by the live weighted factor model |
| **`progress%`** | A 0–100 composite "capability meter" (distinct from `T_AGI`) |
| **`confidenceBand`** | The uncertainty range rendered around the date |
| **`FactorSample`** | One normalized, cited, time-stamped observation of a single factor |
| **`engine_state`** | A full snapshot: `T_AGI`, `progress%`, band, top movers, definition, timestamp |
| **`estimate_history`** | The time series of past `engine_state.T_AGI` values (powers the movement chart) |
| **`run_ledger`** | The audit record of one agent refresh cycle |
| **`mover`** | A factor that materially changed the date in the latest run, with a human-readable rationale |
| **Accelerator / Decelerator** | A factor whose increase pulls the date sooner / pushes it later |

## Design north star

Minimalist tones, fluid motion, beautiful render. Lots of negative space, precise mono numerals,
a restrained palette with a single accent that warms as the date nears, and motion that feels
physical (springs, eased transitions) rather than mechanical. Performance is part of the
aesthetic: the page must feel instant. See [07-FRONTEND-DESIGN](07-FRONTEND-DESIGN.md) and
[08-PERFORMANCE](08-PERFORMANCE.md).

## Non-goals

- Not a betting platform; not financial advice.
- Not claiming a *true* AGI date — it is an aggregator/estimator with explicit uncertainty.
- Not a news site — the timeline is curated signal, not a feed.

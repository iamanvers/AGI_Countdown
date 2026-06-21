# 02 — Clock Engine

The engine has two cleanly separated layers:

- **Layer A — Estimator** (deterministic, server-side, recomputed every refresh): turns verified
  signals into `T_AGI`, `progress%`, and a `confidenceBand`.
- **Layer B — Live ticker** (client-side): smoothly animates the countdown locally and eases to new
  targets pushed over SSE.

Layer A lives in `packages/engine` as **pure functions with no I/O and no LLM calls**. This is the
deterministic core described in [01-ARCHITECTURE](01-ARCHITECTURE.md).

---

## Layer A — Estimator

### Top-level formula

```
T_AGI(t) = Anchor(t)  +  Δ_factors(t)            // Δ in months; negative ⇒ sooner
```

The date is an **anchor** (what the crowd/experts/models currently expect) **plus a shift** (how
our live reading of momentum pulls that expectation sooner or later). Both parts are transparent on
the methodology page.

### Anchor(t) — forecast-consensus baseline

`Anchor` is a weighted mixture of probability distributions over the AGI **year**, one distribution
per forecast source, matched to the active `definition`:

| Source | Form | Notes |
|--------|------|-------|
| Metaculus (definition-matched question) | Community CDF over date | Primary, updates continuously |
| Manifold | Market-implied probability → date distribution | Faster-moving, noisier |
| Expert surveys (AI Impacts / AAAI) | Aggregate median + spread | Slow-moving anchor |
| Model-based timelines (Cotra bio-anchors; Epoch compute models) | Parametric distribution | Grounds the blend in compute trends |

Procedure:

1. Convert each source to a normalized probability distribution over years.
2. Combine as a **weighted mixture** `Σ aᵢ · Dᵢ` (mixture weights `aᵢ` are config, surfaced in the
   methodology).
3. **`Anchor` = median** of the mixture. The **inter-source spread** (e.g., 10th–90th percentile
   envelope) feeds the `confidenceBand`.

Mixture (not simple averaging of point estimates) is deliberate: it preserves disagreement and
fat tails instead of collapsing them into a falsely precise midpoint.

### Δ_factors(t) — the live shift

```
Δ_factors(t) = clamp( Σ_i  w_i · s_i(t),  −MAX_SHIFT, +MAX_SHIFT )

s_i(t) = EWMA( normalize( raw_i(t) ) ) · sign_i
```

- **`raw_i(t)`** — the latest value of factor *i* (e.g., frontier training-FLOP, GDELT AI-tone,
  datacenter power headroom).
- **`normalize`** — to a comparable scale, per factor: z-score against its own history, or a 0–1
  momentum (rate of change) transform. The transform is part of the factor's registry entry.
- **`EWMA`** — exponential smoothing so the signal (and therefore the clock) never jitters.
- **`sign_i`** — `+1` for accelerators (their increase pulls the date **sooner**, i.e. contributes
  a *negative* month delta after the sign convention below) and `−1` for decelerators.
- **`w_i`** — weight in *months of shift per unit normalized signal*. Config, surfaced publicly.
- **`clamp(... , −MAX_SHIFT, +MAX_SHIFT)`** — the total live shift is **bounded** (e.g. ±36
  months) so the engine cannot produce absurd dates even under adversarial data.

> **Sign convention.** Internally we treat "more progress" as pulling `T_AGI` earlier. Accelerators
> increase momentum → reduce the months-to-AGI; decelerators increase the months-to-AGI. The
> registry stores `sign_i` so the arithmetic is explicit and testable.

### progress% — the capability meter (separate from the date)

`progress%` is **not** derived from `T_AGI`; it is its own 0–100 composite, used for the meter UI:

```
progress% = 100 · ( b · benchmarkSaturation
                  + c · computeVsRequired
                  + d · economicDeployment )      // b + c + d = 1, per-definition weights
```

- **benchmarkSaturation** — basket of frontier benchmarks (MMLU-Pro, GPQA-Diamond, ARC-AGI-2,
  SWE-bench Verified, FrontierMath, HLE, …) mapped to saturation 0–1.
- **computeVsRequired** — current frontier training compute vs an Epoch-style estimated
  AGI-compute requirement (log-scaled).
- **economicDeployment** — adoption/usage/automation signals (definition-weighted; higher weight
  for `transformative-ai`).

### confidenceBand

```
band = f( anchorSpread, factorVolatility )
```

Wider when forecast sources disagree or when factor signals are volatile; narrower when they
converge. Rendered as a fuzzy range around the date — visually communicating "this is an estimate."

### Outputs persisted each run

```ts
type EngineState = {
  ts: string;                 // ISO timestamp of computation
  definition: 'weak-agi' | 'transformative-ai' | 'strong-agi';
  tAgi: string;               // ISO projected datetime
  progress: number;           // 0..100
  band: { earlyP10: string; lateP90: string };
  anchor: string;             // ISO baseline before Δ
  deltaMonths: number;        // applied shift (post-clamp)
  movers: Mover[];            // ranked factor contributions this run
};

type Mover = {
  factorId: string;
  contributionMonths: number; // signed
  rationale: string;          // human-readable (written by the Synthesis agent)
  citation: string;
};
```

Each run also **appends `tAgi` to `estimate_history`**, enabling the signature "how the projected
date has moved over time" chart on the methodology page.

---

## Factor registry

Every factor is a typed record. Weights and signs are **config**, surfaced verbatim on the
methodology page so the model is fully inspectable.

```ts
type FactorDef = {
  id: string;
  category: 'internal' | 'external';
  domain: string;                 // 'compute' | 'benchmarks' | 'energy' | ...
  sources: string[];              // source ids from the registry (see 04-DATA-SOURCES)
  normalization: 'zscore' | 'momentum-01' | 'log-zscore';
  sign: 1 | -1;                   // accelerator (+1) / decelerator (-1)
  weight: number;                 // months of shift per unit normalized signal
  cadence: 'hourly' | 'daily' | 'weekly' | 'monthly';
  transform?: string;             // optional pre-transform (e.g. 'log10')
};
```

### Internal — AI progress factors

| Domain | Signals |
|--------|---------|
| **Capability / benchmarks** | MMLU, MMLU-Pro, GPQA-Diamond, ARC-AGI / ARC-AGI-2, SWE-bench Verified, FrontierMath, Humanity's Last Exam, MMMU, GAIA, OSWorld, AIME, LiveCodeBench, agentic/tool-use evals |
| **Frontier releases / architecture** | Release cadence + capability deltas across GPT / Claude / Gemini / Llama / Grok / DeepSeek / Qwen / Mistral; context length, multimodality, reasoning, agentic ability |
| **Compute & scaling** | Training-FLOP of notable models, compute growth rate, cluster sizes, NVIDIA datacenter revenue, algorithmic-efficiency doubling |
| **Prevalence / adoption** | Assistant MAU/DAU, API + OpenRouter usage, enterprise & developer adoption |
| **Frontier-lab health** | Number of frontier labs, talent flows, ARR/revenue, valuations, funding rounds |
| **Research velocity** | arXiv (cs.AI/LG/CL) volume, citations, conference submissions |
| **Buildout economics** | AI VC funding, hyperscaler capex, datacenter / "Stargate"-class announcements, foundry capacity |
| **Autonomy horizon** | METR task-length-doubling (length of tasks models can complete autonomously) |

### External — world factors

| Domain | Signals | Typical role |
|--------|---------|--------------|
| **Energy** | Datacenter power demand & grid headroom, electricity data/prices, nuclear/SMR announcements | Hard ceiling → strong **decelerator** when constrained |
| **Hardware supply** | TSMC capacity, HBM supply, export controls, semiconductor cycle | Decelerator when constrained |
| **Regulation / policy** | EU AI Act milestones, US executive orders & state laws, China policy, safety-summit outcomes, compute governance | **Decelerator** |
| **Backlash / sentiment** | GDELT tone/volume on AI themes, news sentiment, lawsuits, strikes, polls | Decelerator |
| **Macro / geopolitics** | Recession risk, US-China / Taiwan risk, interest rates, AI-bubble dynamics | Mixed |
| **Safety / alignment events** | Dangerous-capability eval results, interpretability milestones, incidents | Mixed |

Each `FactorDef.sources` references concrete entries in [04-DATA-SOURCES](04-DATA-SOURCES.md).

---

## Layer B — Live ticker (client)

- **Never blocks on the network.** On load, the client hydrates from the latest `engine_state` and
  immediately starts animating time-remaining to `T_AGI` via `requestAnimationFrame`.
- **Secondary live odometers** (training-compute/sec, papers/day, $/sec invested) are extrapolated
  locally from the snapshot's rates between refreshes — they keep ticking even with no new data.
- **SSE updates** deliver a new `engine_state`; the ticker **eases** to the new target with a spring
  rather than snapping, so corrections feel organic.
- **Reduced motion** — when `prefers-reduced-motion` is set, the clock updates discretely (no
  sub-second animation), preserving accessibility.

See [07-FRONTEND-DESIGN](07-FRONTEND-DESIGN.md) for the rendering details and
[08-PERFORMANCE](08-PERFORMANCE.md) for why the local animation is central to the "instant" feel.

---

## Calibration & guardrails

- **Bounded shift** (`MAX_SHIFT`) caps the live model's authority over the anchor.
- **EWMA smoothing** on every factor removes jitter.
- **Outlier rejection** at the Critic gate ([03-AGENT-ARCHITECTURE](03-AGENT-ARCHITECTURE.md))
  keeps bad data out of the blend entirely.
- **Backtesting** (see [14-TESTING](14-TESTING.md)) replays historical forecast + factor data to
  confirm the estimate would have moved sensibly over time before any weight set ships.
- **Everything is config** — weights, signs, mixture weights, and `MAX_SHIFT` live in
  `packages/config` and are rendered on the methodology page; changing them is a reviewable diff.

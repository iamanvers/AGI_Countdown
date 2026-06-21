# ADR-0005 — Determinism boundary: agents gather, the engine computes

- **Status:** Accepted
- **Date:** 2026-06-21
- **Related:** [01-ARCHITECTURE](../01-ARCHITECTURE.md), [02-CLOCK-ENGINE](../02-CLOCK-ENGINE.md), [03-AGENT-ARCHITECTURE](../03-AGENT-ARCHITECTURE.md)

## Context

The product publishes a single, emotionally charged number: a date for AGI. A multi-agent LLM fleet
is excellent at the open-ended work of finding, reading, and interpreting messy web data — but LLMs
are non-deterministic and can hallucinate. If an LLM were allowed to *emit the date directly*, the
headline figure would be unreproducible, hard to audit, and vulnerable to a single confident
hallucination.

## Decision

Draw a hard **determinism boundary**:

> **Agents discover, fetch, extract, score, verify, and narrate. The final date is computed by a
> pure deterministic function in `packages/engine` — never emitted by an LLM.**

Concretely:
- Agents output **verified, cited `FactorSample`s** (validated by zod, gated by the Critic).
- The **engine** (pure TS, no I/O, no LLM) turns those samples into `T_AGI`, `progress%`, and the
  band — deterministically.
- The **Synthesis agent** may write the *prose* ("why the clock moved") but takes the *number* from
  `engine.compute(...)`.

## Consequences

- **Reproducible**: identical inputs always yield the identical date.
- **Auditable**: every date traces to inputs + weights; the methodology page shows the arithmetic.
- **Hallucination-contained**: bad values are caught at the Critic gate; even if one slips through,
  bounded `Δ_factors` caps its influence ([ADR-0002](0002-hybrid-clock-engine.md)).
- **Testable**: the engine is unit-tested to the bone; an agent test asserts the Synthesis number
  equals the engine's ([14-TESTING](../14-TESTING.md)).
- Slightly more plumbing (agents can't "just answer") — accepted as the price of credibility.

## Alternatives considered

- **LLM emits the date directly** — rejected: non-reproducible, unauditable, hallucination-exposed.
- **LLM proposes, code lightly adjusts** — rejected: blurs the boundary; the number's provenance
  becomes ambiguous. The boundary must be crisp to be trustworthy.

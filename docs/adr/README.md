# Architecture Decision Records

Short, dated records of significant architectural decisions — the *why* behind the choices, so
future contributors don't re-litigate settled ground (or know exactly what to revisit if context
changes).

Format: [MADR](https://adr.github.io/madr/)-style — Context · Decision · Consequences · Alternatives.

| ADR | Title | Status |
|-----|-------|--------|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-hybrid-clock-engine.md) | Hybrid clock engine (anchor + live factors) | Accepted |
| [0003](0003-multi-agent-fleet-on-dedicated-worker.md) | Multi-agent fleet on a dedicated worker | Superseded by 0006 |
| [0004](0004-atlas-plus-redis-storage.md) | MongoDB Atlas + Redis hot cache | Superseded by 0006 |
| [0005](0005-determinism-boundary.md) | Determinism boundary: data in, engine computes | Accepted |
| [0006](0006-zero-cost-llm-optional.md) | Zero-cost, LLM-optional architecture | Accepted |

New ADRs are added with the next number; superseded ones are marked and linked, not deleted.

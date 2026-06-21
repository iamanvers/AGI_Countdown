# ADR-0001 — Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-06-21

## Context

AGI Countdown makes several consequential, interlocking architectural choices (a hybrid engine, a
multi-agent fleet, a split hosting model, a two-store data plane). These decisions have non-obvious
rationale and trade-offs. Without a record, future contributors will either re-debate settled
questions or unknowingly violate constraints (e.g., the determinism boundary).

## Decision

Keep lightweight **Architecture Decision Records** in `docs/adr/`, MADR-style. Each significant
decision gets a numbered, dated file with Context, Decision, Consequences, and Alternatives. ADRs
are immutable once accepted; changes come as new ADRs that supersede prior ones.

## Consequences

- The *why* behind the system is discoverable and durable.
- Onboarding is faster; reviews can point to an ADR instead of re-explaining.
- Small ongoing cost: a new ADR when a real architectural decision is made.

## Alternatives considered

- **No formal record** — rejected; institutional memory erodes, decisions get re-litigated.
- **Long design doc only** — rejected; doesn't capture point-in-time decisions or their evolution
  as cleanly as numbered ADRs.

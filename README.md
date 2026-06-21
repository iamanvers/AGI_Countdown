# AGI Countdown

A live digital countdown clock for Artificial General Intelligence.

The product is intentionally simple at the surface: one large, precise clock counting down to the
current estimated AGI arrival date. Underneath it is a transparent, deterministic engine that
combines forecast anchors, live factors, uncertainty, citations, and source health into static JSON
snapshots that the site can serve for free.

> Status: application scaffold in progress. The architecture of record lives in `docs/`, with
> ADR-0006 as the current default: zero-cost, deterministic, and LLM-optional.

## What This Is

AGI Countdown is a "Worldometer for AGI": a beautiful digital clock that keeps ticking locally while
the projected date is recomputed by a scheduled deterministic pipeline.

The core rule is:

**Validated data goes in; a pure deterministic function computes the date.**

No LLM is used in the default build. No database, Redis, or always-on worker is required. The
pipeline writes static JSON snapshots and the Next.js app reads them from the CDN.

## Build Shape

```txt
apps/
  web/                 Next.js App Router site and digital countdown UI
  pipeline/            Deterministic refresh script run by GitHub Actions
packages/
  engine/              Pure TypeScript estimator math
  sources/             Structured source connectors and fixture connectors
  validate/            Zod schemas and validation helpers
  config/              AGI definitions, factors, source registry
  shared/              Shared TypeScript types and constants
docs/                  Architecture, roadmap, testing, ADRs
```

## Development

```bash
pnpm install
pnpm dev
```

Useful scripts:

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm refresh
```

The web app serves seeded data from `apps/web/public/data/` until the pipeline is connected to live
sources.

## Documentation

| Doc | What it covers |
|---|---|
| [Overview & AGI Definitions](docs/00-OVERVIEW.md) | Vision, product surface, glossary, switchable AGI definitions |
| [System Architecture](docs/01-ARCHITECTURE.md) | End-to-end data flow, determinism boundary, monorepo layout |
| [Clock Engine](docs/02-CLOCK-ENGINE.md) | Estimator math, anchor blend, factor registry, live ticker |
| [Refresh Pipeline](docs/03-AGENT-ARCHITECTURE.md) | Deterministic pipeline and optional LLM enhancement |
| [Data Sources](docs/04-DATA-SOURCES.md) | Source registry, cadence, access, attribution |
| [Data Model](docs/05-DATA-MODEL.md) | Static JSON contracts and schemas |
| [Data Access](docs/06-API.md) | Static JSON paths and caching |
| [Frontend Design](docs/07-FRONTEND-DESIGN.md) | Pages, components, design system, motion |
| [Performance](docs/08-PERFORMANCE.md) | Rendering strategy, budgets, client animation |
| [Deployment](docs/09-DEPLOYMENT.md) | GitHub Actions and Vercel zero-cost deployment |
| [Observability](docs/10-OBSERVABILITY.md) | Source health and run telemetry |
| [Security & Legal](docs/11-SECURITY-LEGAL.md) | Attribution, secrets, honest framing |
| [Cost Model](docs/12-COST-MODEL.md) | Free-tier constraints and optional upgrades |
| [Roadmap](docs/13-ROADMAP.md) | Phases and milestones |
| [Testing](docs/14-TESTING.md) | Unit, pipeline, E2E, and performance verification |
| [ADRs](docs/adr/README.md) | Architecture decision records |

## Current Target

The first shippable milestone is a polished digital clock:

- Huge mono countdown numerals on `/`
- Definition switcher for `weak-agi`, `transformative-ai`, and `strong-agi`
- Confidence band and top movers visible under the clock
- Static JSON data contract wired end-to-end
- Pure engine v1 and deterministic pipeline scaffold
- Reduced-motion and accessible rendering paths

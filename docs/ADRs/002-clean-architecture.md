# ADR 002: Clean Architecture (Hexagonal / Ports & Adapters)

**Date:** 2026-05-12
**Status:** Accepted
**Deciders:** Taufik

## Context

AUREUS v0.3 will introduce multiple new surfaces simultaneously: dashboard, MCP server, SDK, Anthropic Skills. Each surface needs to invoke common business logic (register endpoint, settle payment, calculate reputation). Without architectural discipline, business logic ends up duplicated or coupled to a specific framework (e.g. Next.js).

Multi-chain expansion (Arc → Ink → Base) further requires the domain to be chain-agnostic.

## Decision

**Adopt Hexagonal Architecture (Ports & Adapters) across the monorepo.**

Three-layer separation:

```
┌─────────────────────────────────────────┐
│ Presentation Layer (adapters: inbound)  │
│ - Next.js Dashboard                     │
│ - MCP Server                            │
│ - REST API                              │
│ - Anthropic Skills                      │
└──────────────┬──────────────────────────┘
               │ calls use cases
               ▼
┌─────────────────────────────────────────┐
│ Application Layer (use cases)           │
│ - RegisterEndpoint                      │
│ - PayForEndpoint                        │
│ - GetReputation                         │
│ - GenerateReceipt                       │
└──────────────┬──────────────────────────┘
               │ uses entities + ports
               ▼
┌─────────────────────────────────────────┐
│ Domain Layer (entities + business rules)│
│ - Endpoint, Agent, Payment, Receipt     │
│ - Pure TypeScript, ZERO dependencies    │
│ - Ports (interfaces) for infra          │
└──────────────┬──────────────────────────┘
               │ ports are implemented by:
               ▼
┌─────────────────────────────────────────┐
│ Infrastructure Layer (adapters: outbound)│
│ - Arc RPC (Viem)                        │
│ - Postgres (Drizzle)                    │
│ - Redis (Upstash)                       │
│ - Smart contract readers/writers        │
│ - TalosFacilitator HTTP client          │
└─────────────────────────────────────────┘
```

## Rationale

### Why pure TS domain (zero deps)?
- Testable in isolation (no DB, no chain, no HTTP)
- Swappable infra without business logic changes
- Easy to reason about — domain is the "what", infra is the "how"

### Why use cases as functions, not classes?
- Composable (chain use cases together)
- Easy to mock (pass mock ports in)
- No "service layer" boilerplate

### Why hexagonal vs MVC?
- MVC couples to web framework (Next.js)
- Hexagonal allows MCP server, dashboard, SDK to all hit the same use cases
- Better for headless / API-first products

### Why monorepo packages?
- `core/` (domain + app), `infra/`, `packages/aureus-sdk/`, `apps/console/`, `apps/mcp-server/`
- Turborepo handles parallel builds + caching
- Type safety across packages

## Folder Layout

See `ROADMAP.md` Phase B and the skeleton in user-facing chat for full structure.

Critical rules:
1. **`core/domain/`** imports from nothing except other domain files
2. **`core/application/`** imports from domain + ports (interfaces only, NOT impl)
3. **`infra/`** implements ports defined in `core/domain/ports/`
4. **`apps/*`** import use cases from `core/application/`, never reach into `infra/` directly except via DI container
5. **`packages/aureus-sdk/`** is consumer-facing, wraps `infra/` adapters with friendly API

## Alternatives Considered

### Alt 1: MVC (Next.js everywhere)
- **Pro:** Simpler, less code
- **Con:** Business logic locked to Next.js context. MCP server can't reuse.
- **Rejected:** doesn't scale to 4 surfaces

### Alt 2: Microservices (separate APIs per concern)
- **Pro:** Maximum separation
- **Con:** Solo dev, ops overhead (deploy, monitor, network). Premature.
- **Rejected:** wait until v1.0+ if traffic justifies

### Alt 3: Anemic domain (data classes only, logic in services)
- **Pro:** Familiar pattern
- **Con:** Business rules scattered, hard to find canonical implementation
- **Rejected:** invites tech debt

### Alt 4 (CHOSEN): Hexagonal
- Industry-standard, well-documented (Cockburn, Vernon, Evans DDD)
- Fits multi-surface product cleanly
- TypeScript-friendly (interfaces as ports)

## Consequences

### Positive
- New surface (e.g. CLI, telegram bot) = new adapter, zero domain changes
- Test pyramid is healthy: many fast domain tests, fewer integration tests
- Onboarding new dev (or future me after time gap) = read `core/` first, infra optional
- Easier to extract microservices if scale demands

### Negative
- More files / packages upfront
- Initial setup overhead (defining ports, DI container)
- Risk of over-engineering for v0.3 scope

### Mitigations
- Use Turborepo for monorepo build orchestration
- Start with simple DI (just function params, no IoC container yet)
- Don't define ports for things only used once — extract only when ≥2 callers exist

## References

- "Hexagonal Architecture" — Alistair Cockburn (2005)
- "Implementing Domain-Driven Design" — Vernon
- Next.js + tRPC examples: https://github.com/t3-oss/create-t3-turbo

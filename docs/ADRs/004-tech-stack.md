# ADR 004: Tech Stack — Next.js 15 + tRPC + Drizzle + shadcn/ui

**Date:** 2026-05-12
**Status:** Accepted
**Deciders:** Taufik

## Context

v0.3 introduces a SaaS dashboard (Console), MCP server, and several new packages. Tech stack choices made now will dictate dev velocity for the next 6 months. The constraint is solo dev capacity.

## Decision

| Layer | Choice | Why |
|---|---|---|
| **Monorepo** | Turborepo + npm workspaces | Existing setup; parallel builds; caching |
| **Language** | TypeScript strict everywhere | Type safety across packages |
| **Smart contracts** | Foundry (existing) | Solidity ^0.8.20, forge-std v1.16.1 — unchanged |
| **Facilitator service** | Hono + Viem (existing) | Unchanged from v0.1 |
| **Dashboard frontend** | Next.js 15 (App Router) | Server components, edge runtime, mature ecosystem |
| **Dashboard backend** | tRPC | Type-safe API, no codegen, native Next.js integration |
| **UI components** | shadcn/ui + Tailwind CSS | Owned components, no runtime CSS-in-JS, accessible defaults |
| **Forms** | react-hook-form + Zod | Type-safe forms, shared schemas with tRPC |
| **Database** | Postgres via Neon | Serverless, scale-to-zero, branching |
| **ORM** | Drizzle | TypeScript-first, no decorators, minimal runtime |
| **Cache** | Redis via Upstash | Serverless, REST API, scale-to-zero |
| **Auth** | SIWE (Sign-In With Ethereum) | Wallet-native, no email/password |
| **Email** | Resend | Developer-friendly, low cost, good DX |
| **Observability** | Sentry + PostHog | Errors + product analytics |
| **Deploy frontend** | Vercel | Native Next.js, edge functions, free tier generous |
| **Deploy backend services** | Hetzner VPS (existing) | TalosFacilitator stays. MCP server may go here. |
| **CI/CD** | GitHub Actions | Free for public repos |
| **Testing (TS)** | Vitest | Faster than Jest, native ESM |
| **Testing (Solidity)** | Foundry | Existing |
| **Linting** | Biome | Fast Rust-based replacement for ESLint + Prettier |
| **Package manager** | npm | Existing root package-lock.json |

## Rationale

### Next.js 15 vs alternatives
- **vs Remix:** Next.js has better Vercel integration, larger ecosystem
- **vs SvelteKit:** TypeScript ergonomics weaker, ecosystem smaller
- **vs Astro:** Astro is content-first; AUREUS needs interactive dashboard
- **Chosen:** Next.js 15 App Router for server components + tRPC compatibility

### tRPC vs REST/GraphQL
- **vs REST/OpenAPI:** tRPC = type safety without codegen
- **vs GraphQL:** GraphQL overkill for solo dev; over-fetching not a problem
- **Chosen:** tRPC for end-to-end type safety, zero codegen

### Drizzle vs Prisma
- **vs Prisma:** Prisma's runtime + binary is heavier; migrations less flexible
- **vs Kysely:** Kysely doesn't have schema-as-TS
- **Chosen:** Drizzle for TypeScript-native, no binary, edge-compatible

### shadcn/ui vs alternatives
- **vs Material UI / Chakra:** Heavy runtime, less customizable
- **vs Headless UI alone:** More work to style
- **vs Mantine:** Big runtime, ok DX
- **Chosen:** shadcn/ui = owned components copied into repo, full customization, Tailwind-native

### Neon vs Supabase/RDS
- **vs Supabase:** Supabase bundles auth/storage we don't need
- **vs RDS:** Always-on, no scale-to-zero
- **Chosen:** Neon for serverless Postgres + branching (dev/staging/prod branches)

### Upstash Redis vs Redis/Memcached
- **vs Redis Cloud:** Always-on, more expensive
- **Chosen:** Upstash for serverless REST, scale-to-zero

### SIWE vs Privy/Clerk
- **vs Privy:** Embedded wallets, more overhead, Web2-friendly UX we don't need for sellers (sellers are Web3 native)
- **vs Clerk:** Email/password only, doesn't fit wallet-first UX
- **Chosen:** SIWE — sellers connect their existing wallet, sign message, done

### Biome vs ESLint + Prettier
- **vs ESLint + Prettier:** Slower, more config, plugin hell
- **Chosen:** Biome = one tool, Rust speed, sensible defaults

## Alternatives Considered

### Backend framework alternatives
- **NestJS:** Too enterprise-y for solo dev, decorators feel like fighting TS
- **Express + plain TS:** Lacks type-safe API layer
- **Bun + Elysia:** Promising but immature; Vercel doesn't support Bun edge yet
- **Chosen:** Next.js + tRPC for unified stack

### Deploy alternatives
- **Cloudflare Workers + D1:** D1 SQLite limits, less mature than Neon Postgres
- **Railway:** Higher cost than Vercel for similar features
- **Self-host on existing Hetzner:** More ops overhead, lose Vercel edge
- **Chosen:** Vercel for frontend, Hetzner for backend services (existing)

### Auth alternatives
- **Clerk:** Email/password, doesn't fit Web3 audience
- **NextAuth.js:** More opinionated, harder to customize for SIWE
- **Privy:** Embedded wallets, overhead we don't need for sellers
- **Chosen:** SIWE direct (use `siwe` npm package + custom JWT)

## Consequences

### Positive
- End-to-end type safety (Drizzle types → tRPC routes → React Query → forms)
- Modern DX, fast dev velocity
- Serverless infra = scale-to-zero for low-traffic v0.3
- Free tier of all services covers v0.3 launch

### Negative
- Multiple managed services = multiple potential outages
- Vercel lock-in (hard to migrate Next.js App Router app off Vercel)
- Drizzle is younger than Prisma — fewer Stack Overflow answers

### Mitigations
- Health checks for each external service
- Use standard Postgres features (no Neon-specific extensions)
- Drizzle's API is closer to SQL — less mystery when debugging

## Cost Estimate (v0.3 monthly)

| Service | Free tier | Estimated cost at 5 sellers, 20 agents |
|---|---|---|
| Vercel (frontend) | Hobby free | $0 |
| Neon (Postgres) | 0.5GB free, 1 branch | $0 |
| Upstash (Redis) | 10K commands/day free | $0 |
| Resend (email) | 100/day free, 3K/mo free | $0 |
| Sentry | 5K errors free | $0 |
| PostHog | 1M events/mo free | $0 |
| Hetzner VPS (existing) | Already paid | Existing |
| **Total new cost** | | **~$0/mo** |

At Phase C (50 sellers): ~$50/mo estimate (Neon Scale $19, Upstash $10, Resend $20).

## Implementation Order

Phase B Week 3-4 setup order:
1. Turborepo + workspace setup
2. `core/` + `infra/` packages
3. Drizzle schema + Neon connection
4. tRPC routers in `apps/console/`
5. Auth (SIWE)
6. shadcn/ui setup + first pages
7. Connect to Arc RPC for real data

## References

- Next.js 15: https://nextjs.org/docs
- tRPC: https://trpc.io/docs
- Drizzle: https://orm.drizzle.team
- shadcn/ui: https://ui.shadcn.com
- Neon: https://neon.tech/docs
- Upstash: https://upstash.com/docs
- Reference repo (similar pattern): https://github.com/t3-oss/create-t3-turbo

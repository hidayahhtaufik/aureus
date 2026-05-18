# ADR 001: SaaS Pivot — From Infrastructure-Only to Product-Layer

**Date:** 2026-05-12
**Status:** Accepted
**Deciders:** Taufik (solo, with research synthesis)
**Supersedes:** Original v0.2 plan (Mitra SDK as protocol-only orchestrator)

## Context

The original AUREUS v0.2 plan locked on 2026-05-08 framed the project as **infrastructure protocol**: TalosFacilitator + Tessera + Honos + Acta + Mitra SDK. The product surface was implicitly "library consumers."

Two events on 2026-05-11 changed the landscape:

1. **Circle Agent Stack launched** (May 11) — shipped Agent Wallets, Agent Marketplace, Circle CLI, Circle Skills (15 skills Apache 2.0), and `@circle-fin/x402-batching` v3.0.4 (already supports Arc testnet, gas-free Gateway batched settlement)
2. **CNBC: $222M Arc presale at $3B FDV** — a16z led, BlackRock, Apollo, ICE, 12+ Tier-1 investors. Token presale validates the "stablecoin agentic economy" thesis at unprecedented scale

This created two problems for the original plan:
- **Value duplication:** TalosFacilitator as standalone facilitator overlaps with Circle's batched x402 settlement
- **Distribution gap:** Anyone building agent commerce will start from Circle's stack first

## Decision

**Pivot AUREUS to a SaaS product layer that composes Circle's infrastructure and adds unique on-chain trust primitives.**

Architecture shift:
- TalosFacilitator (existing live) → settlement engine (unchanged)
- Honos + Acta + Tessera → product features (reputation, receipts, policy)
- **NEW:** Console (Next.js dashboard) — primary user surface
- **NEW:** MCP Server (Anthropic protocol) — agent discovery surface
- **NEW:** Anthropic Skills bundle — distribution channel
- **NEW:** `@auranode/aureus-sdk` — high-level wrapper

Positioning shift:
- FROM: "Open x402 facilitator for Arc"
- TO: "Stripe-for-AI-Agents on Arc, with on-chain reputation + audit receipts"

## Rationale

| Reason | Detail |
|---|---|
| **Composition > competition** | Circle's framing of Agent Stack is "chain- and protocol-agnostic open infrastructure" — explicit invitation to compose, not compete |
| **Grant alignment** | Circle Developer Grant Vertical #1 is "Agentic Economic Activity" — direct match |
| **Unique trust primitives** | Circle does NOT have on-chain reputation (Honos), on-chain audit receipts (Acta), or constrained tokens (Tessera). All three are AUREUS moats |
| **Leverage existing assets** | TalosFacilitator already live and proven. Don't throw it away — repurpose as settlement engine |
| **Standards-first** | Arc supports ERC-8004 (agent identity) and ERC-8183 (job escrow). Building to standard, not custom, removes long-term porting cost |
| **Solo dev capacity** | SaaS product = clear scope (dashboard + MCP + SDK). Infrastructure protocol = endless |
| **Grant + VC pipeline** | Circle Grant → Circle Ventures referral. Arc Builders Fund waitlist + 25-firm syndicate (Dragonfly, Electric, Haun, Lightspeed) |

## Alternatives Considered

### Alt 1: Stay infrastructure-only (original v0.2 plan)
- **Pro:** Less surface area, narrower scope
- **Con:** Direct overlap with Circle. No clear user. Grant pitch weaker.
- **Rejected:** lose distribution leverage

### Alt 2: Pivot to "verifiable AI receipts" only (Acta + Gensyn REE)
- **Pro:** Unique angle, no Circle overlap
- **Con:** Gensyn REE crypto receipt is hash thumbprint, NOT signed proof — weaker claim than hoped. Gensyn mainnet 3 weeks old, unaudited.
- **Rejected:** building on too-immature foundation

### Alt 3: Full multi-vendor orchestration (Mitra SDK with 10+ adapters)
- **Pro:** Maximum optionality
- **Con:** Solo dev = 12-18 weeks just for adapters. No clear v0.3 ship.
- **Rejected:** scope creep, violates `feedback_no_scope_creep.md` discipline

### Alt 4 (CHOSEN): SaaS layer on existing assets + 1 strategic integration
- **Pro:** Ship-able in 8 weeks. Leverages built infra. Clear users. Grant-aligned.
- **Con:** Less ambitious than Alt 3
- **Accepted:** correct trade-off for solo dev with grant deadline

## Consequences

### Positive
- Phase B (v0.3 MVP) deliverable is concrete: Console + MCP + Skills + 3 contract deployments
- Grant application has live product to point at (not just protocol)
- Open-source community alternative to Circle's curated marketplace
- Multi-chain story (Arc + Ink in v0.4) creates moat vs Circle (which is Arc-focused)

### Negative
- Subscription billing infra needed (Stripe Checkout for fiat customers)
- Dashboard maintenance overhead (Next.js + Postgres + Redis)
- Customer support surface (Cal.com + Slack community)
- Brand confusion potential: AUREUS = protocol + product + dashboard all

### Mitigations
- Subscription billing optional until 50+ free tier users (Phase C)
- Use Vercel + Neon + Upstash (managed services, minimal ops)
- Customer support deferred to Phase C (low volume in B)
- Brand: AUREUS umbrella, sub-product names clear (Console, MCP, SDK)

## Implementation

See `ROADMAP.md` for Phase A-E breakdown. See `PRODUCT_SPEC.md` for full product definition. See `ARCHITECTURE.md` for technical design (next ADRs detail specific choices).

## Validation

- Phase B success criteria: 5 sellers, 20 agents, $5+ USDC volume, grant decision received
- If <50% hit: honest re-evaluation, possible pivot or sunset
- If 80%+ hit: proceed to Phase C v0.4

## References

- Circle Agent Stack launch: https://www.circle.com/pressroom/circle-launches-ai-infrastructure-to-power-the-agentic-economy
- Arc token presale CNBC: https://www.cnbc.com/2026/05/11/circle-closes-222-million-from-blackrock-apollo-for-arc-blockchain.html
- Circle Developer Grants: https://circle.questbook.app
- Original v0.2 lock: `/Users/taufik/.claude/projects/-Users-taufik-Desktop-Project-Arc/memory/project_aureus_lockin.md`

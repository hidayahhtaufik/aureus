# AUREUS — Roadmap & Tracking Document

**Last updated:** 2026-05-12
**Current phase:** Pre-Phase-A (planning)
**Builder:** Taufik (auranode.xyz)
**Repo:** github.com/hidayahhtaufik/aureus
**Live URL:** https://aureus.auranode.xyz

---

## North Star Metric

**Monthly settled volume (USDC)** through aureus.auranode.xyz facilitator.

| Phase | Target | Date (estimate) |
|---|---|---|
| v0.3 end | $100 USDC / month | Week 8 |
| v0.5 end | $1,000 USDC / month | Week 16 |
| v1.0 | $10,000 USDC / month | Month 6 |

---

## Asset Inventory (built, verified as of 2026-05-12)

### ✅ Live & Production
- **TalosFacilitator** at https://aureus.auranode.xyz
- Stack: Hono + Viem + Zod + TS, Docker + Nginx + Let's Encrypt on Netcup VPS
- 3 endpoints: /supported, /verify, /settle
- 36 Vitest tests passing
- 3 on-chain settlements verified on Arcscan:
  - `0x401ff5...136f`
  - `0xd7e7...d859`
  - `0x473d4278...38a8`

### ✅ Coded + Tested (NOT deployed)
- **Tessera.sol** — 432 LOC, 22-26 Foundry tests
- **Honos.sol** — 373 LOC, 20-27 tests
- **Acta.sol** — 263 LOC, 11-13 tests
- ~72 contract tests passing total
- Foundry build artifacts in `out/`

### ✅ SDK package built (NOT published)
- `@auranode/x402-arc` v0.1.0
- 3 export paths: main, /client, /server

### ✅ Documentation
- README.md
- RESEARCH.md (Day 2 Arc verification)
- docs/ARCHITECTURE.md (500+ lines, canonical design)
- docs/grant-application.md (draft)
- docs/x402-pr-plan.md
- docs/PRODUCT_SPEC.md (this doc set, 2026-05-12)
- docs/RESEARCH_SUMMARY.md (this doc set)
- docs/ADRs/ (this doc set)

### ❌ Gaps (must close)
- Contracts NOT deployed to Arc testnet
- npm package NOT published
- No dashboard UI
- No MCP server
- No Anthropic Skills package
- Demo apps are stubs
- Grant application NOT submitted
- Discord intro NOT posted

---

## Phase A — Close-Out v0.1/v0.2 (Week 1-2)

**Goal:** Ship existing assets to production state. **No new features.**

### Week 1
- [ ] Deploy Tessera.sol to Arc testnet → record address
- [ ] Deploy Honos.sol to Arc testnet → record address
- [ ] Deploy Acta.sol to Arc testnet → record address
- [ ] Verify all 3 contracts on testnet.arcscan.app
- [ ] Update `reference_arc_addresses.md` memory + README
- [ ] Run end-to-end test using deployed contracts (not Foundry forks)

### Week 2
- [ ] Publish `@auranode/x402-arc` to npm (v0.1.0)
- [ ] Polish examples/seller (real Express app with weather API)
- [ ] Polish examples/buyer (CLI agent that pays for weather)
- [ ] Record 90-second demo video (BI + EN subtitle)
- [ ] Submit Circle Developer Grant application via questbook
- [ ] Submit Arc Builders Fund waitlist application
- [ ] Open issue at github.com/x402-foundation/x402 — "Adding Arc Network support"
- [ ] Discord intro post in Arc and Circle channels (with live demo URL)
- [ ] LinkedIn post (BI + EN) + X thread

### Phase A success criteria
- [ ] Tessera/Honos/Acta deployed addresses public on Arcscan
- [ ] npm `@auranode/x402-arc` installable
- [ ] Grant application submitted (acknowledged by Circle team)
- [ ] At least 3 external developers see the project

---

## Phase B — Aureus v0.3 MVP (Week 3-8)

**Goal:** Ship working SaaS dashboard + MCP server.

### Week 3-4: Core + Infra layers
- [ ] Setup Turborepo for parallel builds
- [ ] Build `core/` package (domain + application, pure TS, 100% coverage)
  - [ ] Entities: Endpoint, Agent, Payment, Receipt
  - [ ] Domain services: ReputationCalculator, PricingTierResolver, ReceiptVerifier
  - [ ] Use cases: RegisterEndpoint, PayForEndpoint, GetReputation, GenerateReceipt
- [ ] Build `infra/` package (adapters)
  - [ ] arc-rpc.ts (Viem client)
  - [ ] honos-reader.ts (on-chain rep)
  - [ ] acta-writer.ts (emit receipts)
  - [ ] facilitator-client.ts (HTTP to TalosFacilitator)
  - [ ] postgres-store.ts (Drizzle)
  - [ ] redis-cache.ts (Upstash)
- [ ] Build `packages/aureus-sdk` (high-level wrapper)

### Week 5-6: Console (Next.js dashboard)
- [ ] Setup Next.js 15 + tRPC + Drizzle + Tailwind + shadcn/ui
- [ ] Setup Postgres (Neon) + Redis (Upstash) + Resend (emails)
- [ ] SIWE auth flow (Sign-In With Ethereum)
- [ ] Endpoint CRUD pages (list, add, edit, disable)
- [ ] Analytics page (live data via tRPC subscription)
- [ ] Receipts page with CSV/PDF export
- [ ] Settings page (API key rotation, plan info)
- [ ] Deploy to Vercel: console.aureus.auranode.xyz

### Week 7: MCP Server + Skills
- [ ] MCP server with 4 tools: discover, pay, reputation, verify
- [ ] Deploy MCP at mcp.aureus.auranode.xyz
- [ ] Write 3 Anthropic Skills:
  - [ ] `use-aureus-pay` — how agents pay
  - [ ] `deploy-aureus-endpoint` — how sellers register
  - [ ] `verify-aureus-receipt` — how to verify Acta
- [ ] Test from Claude Code locally
- [ ] Submit Skills bundle to Anthropic plugin marketplace (or self-distribute via GitHub)

### Week 8: Polish + Launch
- [ ] Deploy AureusRegistry.sol (on-chain endpoint index)
- [ ] Deploy AgentEscrow.sol (ERC-8183 wrapper, deferred payments)
- [ ] End-to-end test: Claude Code → MCP discover → SDK pay → settlement → Acta receipt
- [ ] Public launch: LinkedIn + X thread (BI + EN), Reddit r/ethdev, HN
- [ ] Demo video v2 (showing dashboard + MCP flow)
- [ ] Apply to Arc Quickstart Spotlight

### Phase B success criteria
- [ ] 5 sellers register endpoints
- [ ] 20 agents make payments
- [ ] $5+ USDC settled volume
- [ ] 1 community contribution (issue/PR)
- [ ] Grant decision received from Circle (pass/fail/feedback)

---

## Phase C — Aureus v0.4 Hardening (Week 9-12)

**Goal:** Production-grade. Multi-chain. Paying customers.

- [ ] Deploy facilitator + contracts to Ink (Kraken L2) — second chain
- [ ] Circle dev-controlled wallets adapter (sellers can receive into Circle Wallet)
- [ ] Integrate Circle Compliance Engine for sanctions screening (when GA)
- [ ] Audit Honos + Acta + Tessera (if grant funded → Trail of Bits / Veridise)
  - Backup: peer review by 3 Web3 security devs
- [ ] Subscription billing (Stripe Checkout for fiat customers)
- [ ] Customer support: Cal.com booking + Slack community workspace
- [ ] Status page (statuspage.io or hand-rolled)
- [ ] Observability: Sentry (errors), PostHog (analytics), Logtail (logs)

### Phase C success criteria
- [ ] 50 sellers across Arc + Ink
- [ ] $100+ USDC monthly volume
- [ ] 99% uptime SLA
- [ ] 1 paying customer (Pro tier $29/mo)
- [ ] At least 1 inbound enterprise inquiry

---

## Phase D — Aureus v0.5 Differentiation (Week 13-16)

**Goal:** Add unique features Circle/Coinbase can't easily replicate.

- [ ] Gensyn REE adapter — Acta receipt wraps REE crypto hash thumbprint
  - User-facing: "verifiable AI inference receipts"
- [ ] Boundless ZK verifier — self-deploy `RiscZeroVerifierRouter` on Arc
  - User-facing: "ZK-attested agent decisions for high-value tx"
- [ ] Multi-chain dashboard view (Arc + Ink + Base via abstraction)
- [ ] StableFX integration — auto-convert USDC → EURC/USYC for treasury yield
- [ ] White-label / self-host option for enterprise (Docker compose + Helm chart)
- [ ] Indonesian Bahasa Indonesia language toggle in Console UI

### Phase D success criteria
- [ ] 100 sellers, 500 agents, $1,000+ USDC monthly volume
- [ ] 5 paying customers ($150+ MRR)
- [ ] 1 enterprise pilot signed
- [ ] Circle Ventures intro received (via grant pipeline)

---

## Phase E — Aureus v1.0 (Month 6)

**Goal:** Sustainable business.

- [ ] Arc mainnet deployment (when mainnet beta opens, target summer 2026)
- [ ] Indonesian regulatory analysis + KYC partner (for non-USDC fiat pairs)
- [ ] Full audit complete (Trail of Bits / Veridise / OpenZeppelin)
- [ ] 1M USDC cumulative volume milestone
- [ ] Profitable at gross margin level
- [ ] Series Pre-Seed conversation (if VC route) OR
- [ ] Sustained organic growth via product-led approach

---

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-08 | Locked v0.1: TalosFacilitator + Tessera + Honos + Acta naming | Original AUREUS protocol scope |
| 2026-05-08 | EIP-3009 path (not Permit2) | Native USDC, no audit cost, no custom contracts |
| 2026-05-08 | Stack: TypeScript + Hono + Viem + Foundry | Modern, type-safe, edge-compatible |
| 2026-05-09 | Production deploy at aureus.auranode.xyz | Netcup VPS + Docker + Nginx + Let's Encrypt |
| 2026-05-11 | Surveyed Circle Agent Stack pivot | Circle shipped overlapping infra → reassess positioning |
| 2026-05-12 | **Adopted SaaS architecture (Aureus Console + MCP + Skills)** | Compose with Circle, add unique trust primitives, grant-aligned |
| 2026-05-12 | Brand kept = AUREUS umbrella | No rebrand needed; sub-products use pantheon names |
| 2026-05-12 | Tech stack v0.3: Next.js 15 + tRPC + Drizzle + shadcn/ui + Tailwind | Modern, type-safe end-to-end, no codegen |
| 2026-05-12 | Pricing: subscription (Free/Pro/Business/Enterprise) | Predictable; reconsider % of volume post-launch |
| 2026-05-12 | NO own token in v1.0 | Avoid speculation, focus on product. Revisit only if community pull. |

---

## Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| Circle ships own marketplace + reputation | High | Open-source MIT, multi-chain, ERC-8004/8183 standards. Lock-in for users = lower on AUREUS. |
| Solo dev capacity overrun | High | Strict phase gating. Phase A done before B starts. Refuse scope creep mid-phase. |
| Indonesia regulatory tightening | Medium | USDC-only, agent-to-agent, cross-border. No domestic IDR flows. |
| Arc mainnet delayed past summer 2026 | Medium | Testnet works for grant + early users. Mainnet not blocker for v0.3-v0.5. |
| Standards war (x402 vs MPP vs AP2) | Medium | Build x402 first (volume leader). Settlement abstraction enables future adapters. |
| ARC token unlock cliff dumps price | Low | AUREUS doesn't depend on ARC (gas in USDC). Tokenomics risk isolated. |
| Gensyn / Boundless / Lit instability | Low | v0.5+ features. Optional, not load-bearing for MVP. |
| Anthropic Skills marketplace gated | Low | Distribute via GitHub if marketplace closed. Skills are just markdown. |

---

## Out-of-Scope (Parking Lot)

These are real ideas but NOT to be touched until v1.0+:

- AURM/AURT (native AUREUS token) — only if community demand emerges
- Bittensor subnet integration (decentralized AI compute)
- Akash decentralized compute
- Tempo (Stripe + Paradigm) MPP adapter
- Giwa (Upbit + OP) deployment
- Solana x402 integration
- EigenLayer AVS for reputation slashing
- Mobile app (iOS/Android) for seller dashboard
- White-label SDK for partner integrations
- USDCKit deep integration (when stable)

**Rule:** When asked "but what about X?" during current phase, the answer is "park it for vN+1."

---

## Weekly Cadence

- **Monday:** Define 5 specific tasks for the week
- **Wednesday mid-week:** Check blockers, adjust
- **Friday:** End-of-week assessment, mark progress on this doc
- **Sunday:** Review past week's deliverable. Update Decision Log.

---

## Success ≠ Hit Every Box

If we hit 80% of Phase B success criteria + 1 paying customer by Phase C, we ship v0.5. If we hit <50% with no grant + no users, we honestly re-evaluate (pivot or sunset).

**Failure mode to watch:** keep building features without users. Stop and find one if happening.

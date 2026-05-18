# AUREUS — Product Specification

**Status:** v0.3 planning (post research pivot 2026-05-12)
**Owner:** Taufik (auranode.xyz, hello@auranode.xyz)
**Supersedes:** Original v0.2 lock-in plan (preserved in `ARCHITECTURE.md`)

---

## One-Line Pitch

**AUREUS — Stripe-for-AI-Agents on Arc Network.** Monetize your API to AI agents in 5 minutes. Reputation-gated. Audit-ready. Open-source.

---

## Problem Statement

API providers face three problems when serving AI agent traffic:

1. **No micropayment rail** — Stripe minimum $0.50, doesn't work for $0.001-per-call AI inference
2. **No agent reputation system** — can't distinguish good actors from spammers without KYC
3. **No audit trail compatible with crypto-native businesses** — Web2 invoices don't satisfy on-chain treasury reporting

AI agents (LLMs with tool use) face three problems consuming APIs:

1. **No standardized payment protocol** — fragmented per-vendor auth + billing
2. **No discovery mechanism** — agents can't find paid APIs they're authorized to use
3. **No verifiable history** — paying for an API leaves no proof useful for downstream auditing

---

## Solution

AUREUS is a complete commerce SaaS that pairs:

- **TalosFacilitator** (settlement engine, x402 protocol) — already live at `aureus.auranode.xyz`
- **Honos** (on-chain reputation) — gates pricing tiers
- **Acta** (semantic receipts) — auditable per-call records
- **Tessera** (constrained USDC) — bounded agent budgets
- **MCP Server** — agent discovery via Anthropic protocol
- **Console** — Next.js dashboard for sellers
- **SDK** — npm package for both sides

---

## Target Market

### Primary segment: API Providers (Sellers)
- Indie developers monetizing personal APIs
- AI inference startups (RAG, embeddings, fine-tuned models)
- Data API providers (weather, financial, sports, geo)
- MCP server operators

### Secondary segment: AI Agent Developers (Buyers)
- Claude Code / Cursor / Codex users running automation
- Agent framework operators (LangChain, AutoGPT, Eliza)
- Workflow automation builders (n8n, Make, Zapier on-chain side)

### Adjacent: Enterprises auditing AI agent activity
- Crypto-native treasuries needing per-call cost attribution
- Compliance teams verifying agent behavior

---

## Value Proposition

### For Sellers
- **5-minute integration** — `npm install @auranode/aureus-sdk` + 1 middleware line
- **Sub-cent pricing** — $0.0001 minimum (via Circle Gateway batching)
- **Reputation gating** — exclude bots, reward high-rep agents with discounts
- **On-chain receipts** — auto-generated audit log via Acta
- **Multi-chain ready** — start Arc, expand Ink/Base without code change

### For Buyers (AI Agents)
- **Auto-discovery** — MCP server lists all available endpoints
- **Auto-payment** — SDK handles 402 challenges transparently
- **Reputation portability** — single Honos score works across all Aureus sellers
- **Verifiable history** — every payment leaves on-chain proof

### For Enterprises
- **CSV/PDF export** of all agent transactions
- **Tax-ready receipt format** (intent → outcome semantic)
- **Compliance Engine integration** (Circle sanctions screening, when available)

---

## Pricing Model (proposed)

| Tier | Price | Settlements/mo | Features |
|---|---|---|---|
| Free | $0 | 100 | Basic dashboard, MCP discovery |
| Pro | $29/mo | 10K | Analytics, receipt export, custom domain |
| Business | $99/mo | 100K | Multi-chain, Compliance Engine, priority support |
| Enterprise | Custom | Unlimited | White-label, SLA, dedicated facilitator |

**Alternative:** % of volume (0.5% of settled USDC). To be decided post v0.3 launch based on user feedback.

---

## Competitive Differentiation

| Capability | AUREUS | Circle Agent Stack | Coinbase x402 SDK |
|---|---|---|---|
| Open source license | MIT | Apache 2.0 (Skills only) | Proprietary |
| On-chain reputation | ✅ Honos | ❌ | ❌ |
| On-chain receipts | ✅ Acta | ❌ (off-chain Gateway logs) | ❌ |
| Multi-chain (Arc + Ink + Base) | ✅ v0.4 | Arc-focused | Base-focused |
| MCP server included | ✅ | ❌ | ❌ |
| Constrained USDC (Tessera) | ✅ | Partial (Agent Wallets policy) | ❌ |
| ERC-8004 / 8183 native | ✅ | Unknown | Unknown |

**Positioning:** AUREUS composes WITH Circle, not against. Where Circle ships hosted infrastructure, AUREUS ships open community alternatives + trust primitives Circle doesn't have.

---

## Strategic Alignment

### Circle Developer Grants (open via questbook)
AUREUS hits **Vertical #1: Agentic Economic Activity** verbatim. Direct match.

### Arc Builders Fund (waitlist)
"Agentic commerce" is named focus area. 25+ VCs in syndicate (Dragonfly, Electric, Haun, Lightspeed).

### Anthropic ecosystem
Skills + MCP standardize agent-side integration. Circle has 15 Skills published; AUREUS ships complementary skills (use-aureus-pay, deploy-aureus-endpoint, verify-aureus-receipt).

### Indonesian builder identity
- Indonesia regulatory red line: no IDR stablecoin payment domestically
- AUREUS solves this by being USDC-only, agent-to-agent, cross-border
- Identity = "Indonesian-built open infrastructure for global agent commerce"

---

## Naming & Pantheon

| Component | Etymology | Purpose |
|---|---|---|
| **AUREUS** | Roman gold coin, predecessor to Solidus | Protocol umbrella + product name |
| **Talos** | Greek bronze automaton guardian | Facilitator (settlement engine) |
| **Tessera** | Roman tessera (token, pass, voucher) | Constrained USDC |
| **Honos** | Roman god of honor | Reputation bond |
| **Acta** | Roman acta (public records) | Semantic action receipts |
| **Mitra** | Vedic/Persian god of contracts | SDK (orchestrator) |

Theme: Greco-Roman pantheon. Aureus (currency) → Talos (guardian) → Tessera/Honos/Acta (institutional primitives) → Mitra (the contract that binds them).

---

## Success Metrics

### v0.3 MVP (8 weeks from kickoff)
- ✅ Console live at `console.aureus.auranode.xyz`
- ✅ MCP server live at `mcp.aureus.auranode.xyz`
- ✅ 5 sellers register endpoints
- ✅ 20 agents make payments
- ✅ $5+ USDC settled volume
- ✅ Grant decision received from Circle

### v0.5 Hardening (16 weeks)
- 50 sellers
- 200 agents
- $100+ USDC monthly volume
- 1 paying Pro customer ($29/mo)
- Audit complete or peer-reviewed

### v1.0 Sustainable (6 months)
- 100 sellers, 500 agents
- $1,000+ USDC monthly volume
- 5 paying customers, $200+ MRR
- Profitable at gross margin
- Arc mainnet deployment

---

## Open Questions (to resolve before v0.3 kickoff)

1. **Billing infra:** Stripe Checkout for fiat-paying customers, or USDC-only (more on-brand)?
2. **Domain strategy:** `console.aureus.auranode.xyz` or new `aureus.pay`?
3. **Token:** Does AUREUS need its own token? **Lean: NO** for v1.0. Revisit only if community demand exists.
4. **Compliance:** Wait for Circle Compliance Engine GA, or integrate Coinbase TRM Labs alternative?
5. **Geography:** Indonesia-friendly DPA / TOS — when does this need legal review?

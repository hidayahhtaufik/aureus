# Aureus Protocol — Architecture

**Status:** v0.1 live (TalosFacilitator at https://aureus.auranode.xyz). v0.2 in development.

This document is the canonical architectural reference for Aureus. It captures
every design decision, the reasoning behind each, and the path from current
state to v1.0.

---

## 1. One-Sentence Summary

Aureus is the **financial substrate for autonomous agent commerce on
stablecoin-native chains** — starting on Arc Network — providing four
composable primitives (facilitator, constrained spending, reputation bonds,
semantic receipts) plus a custody-agnostic agent SDK.

---

## 2. Stack at a Glance

```
┌────────────────────────────────────────────────────────────────┐
│  USERS                                                          │
│  Operators: humans · DAOs · companies · AI startups             │
│  Agents: autonomous economic actors (LLM-driven or rules)       │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│  AGENT RUNTIME (operator's choice)                              │
│  Claude Agent SDK · OpenAI Assistants · LangGraph · Vincent     │
│  AI compute: any (OpenAI · Anthropic · Bittensor · Gensyn)      │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│             MITRA AGENT SDK (v0.3 — TypeScript)                 │
│  Composes Aureus primitives + custody adapter into a single     │
│  high-level interface for agent operators.                      │
└──┬──────────┬───────────┬──────────────────┬─────────────┬────┘
   │          │           │                  │             │
   ▼          ▼           ▼                  ▼             ▼
┌─────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────┐
│CUST.│  │ TESSERA  │  │ HONOS    │  │ ACTA         │  │ TALOS    │
│     │  │ (v0.2)   │  │ (v0.2)   │  │ (v0.2)       │  │FACILITATR│
│Lit  │  │          │  │          │  │              │  │ (v0.1) ✅│
│Privy│  │Constraint│  │Reputation│  │Semantic      │  │          │
│Turnk│◄─►│   USDC   │◄►│  bond    │◄►│  receipt    │◄►│x402+EIP- │
│4337 │  │ (cUSDC)  │  │ (decay,  │  │ (intent →    │  │  3009    │
│     │  │ programb │  │  slash,  │  │  outcome)    │  │ settles  │
│     │  │ spending │  │  pledge) │  │              │  │ on Arc   │
└──┬──┘  └────┬─────┘  └────┬─────┘  └────┬─────────┘  └────┬─────┘
   │          │             │             │                 │
   └──────────┴─────────────┴─────────────┴─────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│             SETTLEMENT — ARC NETWORK (primary)                  │
│  Chain ID 5042002 · Malachite BFT · sub-second finality         │
│  USDC as native gas · EIP-3009 native · CCTP V2 · Permit2       │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           │  (v1.0+ multi-chain expansion)
                           ▼
        ┌──────────────────┬──────────────────┬──────────────────┐
        ▼                  ▼                  ▼                  ▼
   ┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
   │ INK     │      │ BASE     │      │ TEMPO    │      │ ETHEREUM │
   │ Kraken  │      │ Coinbase │      │ Stripe + │      │ mainnet  │
   │ L2      │      │ L2       │      │ Paradigm │      │          │
   └─────────┘      └──────────┘      └──────────┘      └──────────┘
                            │
                            ▼
                  ┌─────────────────────┐
                  │ Circle Gateway/CCTP │  ← cross-chain unified USDC
                  └─────────────────────┘
```

---

## 3. Components

### 3.1 TalosFacilitator (v0.1 — LIVE)

x402 facilitator service implementing the EIP-3009 path on Arc.

**What it does:**
- HTTP endpoints `/verify`, `/settle`, `/supported`
- Verifies x402 payment payloads off-chain (signature, balance, nonce, time)
- Broadcasts `transferWithAuthorization` on-chain via facilitator wallet
- Returns settlement details (tx hash) to caller

**What's it built with:**
- Hono + Viem + Zod + TypeScript strict
- 36 unit tests (Vitest)
- Container: Docker (Node 20 Alpine)
- Production: Nginx + Let's Encrypt at https://aureus.auranode.xyz

**Why it exists:**
x402 was supported on Base, Solana, Algorand, Stellar — but not Arc.
TalosFacilitator fills the gap, becoming Arc's first community implementation.

### 3.2 Tessera — Constrained USDC (v0.2)

A wrapper standard that lets agents hold "policy-constrained" USDC.

**The gap it fills:**
ERC-20 `approve` is one-dimensional ("contract X may spend up to Y").
Real agents need: "spend max $5/day on AI_COMPUTE category, allowlist
[OpenAI, Anthropic], expires in 30 days, with operator kill switch."

**What it is:**
- ERC-20-shaped contract that wraps native USDC
- Each Tessera position is bound to an on-chain `Policy` struct
- Constraints: per-tx cap, daily cap, expiry, recipient allowlist (Merkle), category, kill key
- Spending unwraps automatically on the receiver side if policy passes

**Why this is novel:**
- Not approve-based (those revoke is reactive, not preventive)
- Not ERC-7715 (heavyweight, AA-specific)
- Asset-native — the constraint travels with the dollar itself
- EIP-able as a new standard

### 3.3 Honos — Reputation Bond (v0.2)

Tokenized reputation that decays, can be slashed, and can be pledged as
collateral.

**The gap it fills:**
EAS/Sign Protocol attestations are static (write-once). Agent reputation
needs to be:
- Built from successful actions (recordSuccess events)
- Decayed by inactivity (half-life parameter)
- Slashable on dispute resolution
- Pledgeable as collateral (services accept it as bond instead of escrow)

**What it is:**
- ERC-721 per agent
- On-chain state: `{ reputation, lastActionAt, decayHalfLife, slashableSurface }`
- Functions: `recordSuccess`, `slash`, `pledge`, `effectiveReputation` (with decay)
- A *financial primitive* disguised as a reputation system

### 3.4 Acta — Semantic Action Receipt (v0.2)

Standardized receipt emitted on every agent action, capturing intent,
outcome, and counter-signed proof.

**The gap it fills:**
EVM event logs are too low-level. Generic EAS attestations lack agent-
specific schema. We need a structured receipt that:
- Captures intent (what the agent tried to do)
- Captures outcome (did it succeed/fail/partial?)
- Counter-signed by both parties (no fraud)
- Indexable for downstream protocols (lending decisions, audits)

**What it is:**
- Structured on-chain event with semantic fields
- Auto-emitted by Tessera on spend, by TalosFacilitator on settle
- Fields: `agent`, `operator`, `counterparty`, `categoryHash`, `amount`, `intentHash`, `outcomeHash`, `satisfactionDelta`, `serviceCounterSig`

### 3.5 Custody Adapter (v0.3)

A pluggable interface for agent key management. **Not tied to any single
provider** — Aureus is custody-agnostic so a single vendor outage does
not halt the protocol.

```typescript
interface ICustodyAdapter {
  createAgentWallet(operator: Address, policy: Policy): Promise<AgentWallet>;
  signTypedData(walletId: string, data: TypedData): Promise<Hex>;
  killSwitch(walletId: string): Promise<void>;
  getAddress(walletId: string): Promise<Address>;
}
```

**Implementations (operator picks at runtime):**
- `LitCustodyAdapter` — Lit Protocol Naga V1 (MPC + TEE) — primary
- `PrivyCustodyAdapter` — embedded wallets — backup
- `TurnkeyCustodyAdapter` — non-custodial wallet infra — backup
- `ERC4337CustodyAdapter` — pure smart account via Pimlico (already on Arc) — self-custody fallback

**Why custody-agnostic:**
- Resilience: if Lit goes down, agents on Privy keep working
- User choice: operator decides custody trust model
- Vendor independence: Aureus survives any single provider failure

### 3.6 Mitra Agent SDK (v0.3)

A TypeScript wrapper that combines all the above into a single high-level
interface for agent operators.

```typescript
const agent = await Mitra.deploy({
  operator: "0x...",
  custody: "lit", // or "privy" | "turnkey" | "erc4337"
  budget: { amount: "1000", asset: "USDC" },
  policy: {
    dailyCap: "50",
    categoryAllowlist: ["AI_COMPUTE", "DATA_API"],
    recipientAllowlist: ["0xOpenAI...", "0xAnthropic..."],
  },
});

// Agent can now make x402-paid calls autonomously
const result = await agent.fetch("https://api.example.com/inference");
// → Tessera enforces policy
// → x402 facilitator settles on Arc
// → Acta receipt emitted
// → Honos updated on success
```

---

## 4. Data Flows

### 4.1 x402 Settlement (v0.1, LIVE)

```
Buyer signs EIP-712 TransferWithAuthorization for Arc USDC
              │
              ▼
Buyer sends payment payload via X-PAYMENT header
              │
              ▼
Seller forwards to TalosFacilitator /verify (off-chain checks)
              │
              ├─ ❌ INVALID → return 402 with reason
              │
              ▼ ✅ VALID
Seller forwards to TalosFacilitator /settle
              │
              ▼
Facilitator simulates → broadcasts transferWithAuthorization
              │
              ▼
Arc settles in <1 second (Malachite BFT)
              │
              ▼
Facilitator returns tx hash to seller
              │
              ▼
Seller serves resource + X-PAYMENT-RESPONSE header
```

### 4.2 Agent Spending (v0.2 + v0.3, planned)

```
Operator creates agent with Tessera-wrapped budget
              │
              ▼
Agent receives intent ("buy weather data, max $0.05")
              │
              ▼
Agent calls x402 endpoint via Mitra SDK
              │
              ▼
SDK → Custody adapter signs EIP-712
              │
              ▼
SDK → x402 client retries with payment header
              │
              ▼
Seller's middleware → TalosFacilitator
              │
              ▼
Facilitator checks Tessera policy
              │
              ├─ ❌ Policy violation → revert
              │
              ▼ ✅ Pass
Tessera spend executes (via underlying transferWithAuthorization)
              │
              ▼
Acta receipt emitted (intent, amount, counterparty signed)
              │
              ▼
Honos.recordSuccess(agent_bond_id, weight)
              │
              ▼
Agent receives content, returns to operator
```

---

## 5. Boundary: What's Aureus, What's Compose

### Aureus owns (single source of truth)
- TalosFacilitator service (live)
- Tessera contract (v0.2)
- Honos contract (v0.2)
- Acta contract (v0.2)
- `@hidayahhtaufik/x402-arc` shared package
- Custody adapter interface
- Mitra Agent SDK

### Aureus composes (third-party, swappable)
- Arc Network (settlement chain)
- Lit Protocol Naga V1 (custody, primary adapter)
- Privy/Turnkey/ERC-4337 (custody alternates)
- Aave/Morpho (yield backend, optional)
- Circle Gateway/CCTP (cross-chain, optional)
- StableFX (FX, optional)
- x402 spec (we implement the standard, Coinbase/x402-foundation owns spec)

### Aureus is not
- A new blockchain
- A consumer wallet (we provide custody adapter, not UX)
- A token issuer (no AUREUS token planned for v0.x)
- An L2 / rollup
- A KYC provider

---

## 6. Design Principles

1. **Stablecoin-native, not chain-native.** Aureus assumes USDC (or its EURC/USYC peers). Chain selection is implementation detail.
2. **Compose, don't reinvent.** Use Arc/Lit/Aave; invent only what's missing.
3. **Custody-agnostic.** Never lock to one custody provider.
4. **Real implementation, no placeholders.** Every endpoint, every contract, fully working before claimed done.
5. **Single source of truth.** One package, one canonical implementation, no duplication.
6. **EIP-able primitives.** Tessera/Honos/Acta designed as candidate ERC standards.
7. **Operator kill switch always available.** Agents may be autonomous, but the operator can halt.

---

## 7. Multi-Chain Strategy

### v0.1 (NOW)
- Arc Testnet — primary deployment
- TalosFacilitator live at https://aureus.auranode.xyz

### v0.2 (Week 3-4, on Arc Testnet)
- Tessera, Honos, Acta deployed on Arc
- Custody adapters integrated
- Mitra Agent SDK shipped

### v1.0 (Q3 2026 — when Arc mainnet beta launches)
- Full stack migrated to Arc mainnet
- Audit complete (using grant funding)
- Ink mainnet deployment (capture INK token TGE airdrop window)
- Base deployment (largest x402 ecosystem)

### v1.5+ (Q4 2026+)
- Tempo deployment (when Stripe/Paradigm mainnet lands)
- Giwa deployment (Korean market, KRW pairs)
- Cross-chain via Circle Gateway / CCTP V2

### Why Arc-first (not multi-chain Day 1)
- Circle grant alignment (Arc-specific funding)
- USDC-as-gas matches our stablecoin-native thesis
- Simpler audit surface (one chain, one gas model)
- Multi-chain code-ready (same Solidity), just deferred deployment

---

## 8. Roadmap & Milestones

| Phase | Timeline | Deliverable | Status |
|-------|----------|-------------|--------|
| **v0.1** | 2026-05-08/09 | TalosFacilitator live | ✅ DONE |
| **v0.2 — Tessera** | 2026-05-12/14 | Constrained USDC contract + tests | 🔜 |
| **v0.2 — Acta** | 2026-05-15/16 | Receipt schema + emitter | 🔜 |
| **v0.2 — Honos** | 2026-05-17/19 | Reputation bond contract | 🔜 |
| **v0.3 — Custody** | 2026-05-20/21 | Custody adapter + Lit + ERC-4337 | 🔜 |
| **v0.3 — Mitra SDK** | 2026-05-22/26 | Agent SDK in TypeScript | 🔜 |
| **v0.3 — Demo** | 2026-05-27/28 | Demo video + grant follow-up | 🔜 |
| **Audit prep** | 2026-Q3 | Sherlock/Spearbit engagement | future |
| **Arc Mainnet** | 2026-Q3-Q4 | When Arc mainnet beta opens | future |
| **Multi-chain (Ink, Base)** | 2026-Q4 | First chain expansions | future |

---

## 9. Failure Modes & Mitigations

| Failure | Impact | Mitigation |
|---------|--------|------------|
| Lit Protocol downtime | Agents can't sign | Custody adapter pattern → switch to Privy/4337 |
| Arc RPC down | Settlement halts | Multi-RPC fallback (Alchemy, dRPC, QuickNode all support Arc) |
| Facilitator wallet drained | New settlements blocked | Auto-refill via cron monitoring + alert |
| USDC contract upgrade breaks ABI | All settlements fail | Version-pin ABI, monitor Circle announcements, hot-swap config |
| Circle ships Gateway-as-facilitator | Aureus redundant? | Position complementary (single-chain dev-friendly vs multi-chain enterprise); compose with Gateway when it lands |
| Agent commerce demand slower than expected | Few users | Foundation play; primitives still useful for non-agent use cases (DAO treasury automation, recurring payments) |

---

## 10. Why Aureus Wins Grants

### For Circle Developer Grants (criteria from circle.com/grant)

| Criterion | How Aureus matches |
|-----------|-------------------|
| Real USDC use case | Every facilitator tx + every Tessera spend = USDC velocity |
| Clean UX | HTTPS API, well-typed SDK, copy-paste demo |
| Skilled team | Validator + builder + 36-test test suite + production deployment |
| Integrates Circle products | USDC, EIP-3009 native, CCTP V2 ready, Gateway compatible |
| Solves real problem | x402 had no Arc support; agents have no custody+spending+receipt+rep stack |

### For Arc Builders Fund (criteria from circle.com/blog/introducing-the-arc-builders-fund)

| Criterion | How Aureus matches |
|-----------|-------------------|
| Needs Arc's unique attributes | USDC-as-gas, sub-second finality, future StableFX integration |
| Path to real use cases | Agent operators, AI startups, SaaS billing, DAO treasuries |
| Builds primitives others compose with | Tessera/Honos/Acta + custody adapter = pure infrastructure |
| Onchain FX, opt-in privacy ready | StableFX integration in v1.5; privacy precompile for shielded streams in v2 |

---

## 11. References

- [x402 Specification](https://github.com/x402-foundation/x402)
- [Arc Network Docs](https://docs.arc.network)
- [EIP-3009: Transfer With Authorization](https://eips.ethereum.org/EIPS/eip-3009)
- [Lit Protocol Naga V1](https://developer.litprotocol.com)
- [Circle Developer Grants](https://circle.com/grant)
- [Arc Builders Fund](https://circle.com/blog/introducing-the-arc-builders-fund)

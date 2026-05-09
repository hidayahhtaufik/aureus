# Aureus Protocol — Circle Developer Grants Application

> Drafted for circle.com/grant submission. Copy-paste sections into the form.

---

## Project Name

**Aureus Protocol**

## One-Sentence Summary

Aureus is the financial substrate for autonomous agent commerce on Arc — providing the first community x402 facilitator (live), plus four composable primitives that let AI agents hold, spend, prove, and reputation-stake USDC on Circle's stablecoin-native L1.

## Tagline

The golden standard for autonomous agent commerce on Arc Network.

---

## Project Description (~250 words)

x402 — the HTTP-native stablecoin payment standard — was supported on Base, Solana, Algorand, and Stellar, but NOT on Arc, Circle's own stablecoin-native L1. Aureus changed that.

In one sprint, we shipped **TalosFacilitator**, the first community x402 facilitator for Arc Testnet. It is live in production at https://aureus.auranode.xyz, behind Nginx + Let's Encrypt, deployed via Docker, with 36 unit tests and verified end-to-end on-chain settlement (multiple txs on Arcscan).

But the facilitator is just step 1. Aureus' real contribution is **four new primitives** that compose to form the substrate for autonomous AI agent commerce:

- **TalosFacilitator** (v0.1, LIVE) — x402 settlement on Arc via EIP-3009.
- **Tessera** (v0.2) — constrained USDC: programmable spending policies (per-tx cap, daily cap, recipient allowlist, category, kill switch) bound to the asset itself.
- **Honos** (v0.2) — reputation bonds: tokenized agent reputation that decays, slashes, and can be pledged as collateral.
- **Acta** (v0.2) — semantic action receipts: counter-signed records of intent → outcome chains.
- **Mitra Agent SDK** (v0.3) — composes Aureus + a custody-agnostic adapter (Lit Protocol primary, Privy / Turnkey / ERC-4337 alternates) into a single TypeScript interface for agent operators.

This is the foundation enterprise-grade AI agent operations need: provable spend constraints, slashable reputation, audit-grade receipts, and resilient custody — all on Arc's deterministic, USDC-native rails.

---

## How does this leverage USDC and expand its utility?

Every layer of Aureus drives USDC velocity:

1. **Facilitator settlements** are USDC on-chain via `transferWithAuthorization` (EIP-3009). Every API call paid through x402 = one USDC transfer on Arc.
2. **Tessera positions** wrap native USDC into policy-bound positions. Programmable spending = more USDC moves, not fewer.
3. **Honos bonds** are denominated in USDC — pledging reputation as collateral routes USDC into escrow positions.
4. **Acta receipts** are emitted on every USDC settlement, providing the audit trail enterprises need to deploy USDC at scale.
5. **Multi-stablecoin ready**: Tessera/Honos/Acta are USDC-first but EURC and USYC compatible, opening multi-currency payroll, FX, and treasury workflows.

We are designed for the agentic economy specifically — the area Circle's tweet explicitly calls out as a funding priority.

---

## What Circle products do you integrate?

- ✅ **USDC** — native settlement on Arc, used for every x402 payment
- ✅ **EIP-3009 Transfer With Authorization** — primary settlement path (verified working on Arc Testnet)
- ✅ **Permit2** — fallback path supported via Aureus types (Arc Testnet deployment verified)
- ✅ **Arc Network** — primary chain, USDC-as-gas, sub-second finality, Malachite BFT
- 🔜 **Circle Gateway / CCTP V2** — planned v1.0 for cross-chain unified balance
- 🔜 **StableFX** — planned v1.5 for multi-stablecoin agent payments
- 🔜 **Circle Wallets** — supported as one of the custody adapter options

---

## Live Production Proof

| Asset | Link |
|---|---|
| Public facilitator | https://aureus.auranode.xyz |
| Health check | https://aureus.auranode.xyz/health |
| Supported endpoints | https://aureus.auranode.xyz/supported |
| Public open-source repo | https://github.com/hidayahhtaufik/aureus |
| Architecture document | https://github.com/hidayahhtaufik/aureus/blob/master/docs/ARCHITECTURE.md |
| Research notes | https://github.com/hidayahhtaufik/aureus/blob/master/RESEARCH.md |

### On-chain settlement proofs

| Date | Tx | Notes |
|---|---|---|
| 2026-05-08 | [`0x401ff573...`](https://testnet.arcscan.app/tx/0x401ff57311fe103e7215a26490d6c8ee6cc91604688e450f2fccc7f12daf136f) | First end-to-end via local facilitator |
| 2026-05-09 | [`0x473d4278...`](https://testnet.arcscan.app/tx/0x473d4278e5f15eec18bbe8dd3bc4057f8f4339af41fea67374c282e5e33838a8) | First settlement via PUBLIC facilitator (HTTPS, Nginx, Docker) |

Each settlement: 0.01 USDC + ~$0.0019 gas, sub-second confirmation.

---

## Technical Quality Indicators

- **36 unit tests passing**, 0 typecheck errors across 4 workspaces
- **Strict TypeScript** (`exactOptionalPropertyTypes`, `noImplicitAny`, `strict`)
- **Single source of truth**: all shared logic in `@auranode/x402-arc` package; no code duplication
- **Comprehensive documentation**: ARCHITECTURE.md (canonical), RESEARCH.md (Day 1-2 verification), DEPLOYMENT.md (production runbook)
- **Custody-agnostic design** — never single point of failure
- **Production deployed** — Docker container, Nginx reverse proxy, Let's Encrypt auto-renewal, healthcheck, log rotation

---

## Path to Users / Usage

### Direct
1. **Indie AI builders** in SEA / India / global — embed Mitra SDK into their agent workflows. Pay per API call without monthly subs.
2. **Web3 startups** with USDC treasuries — automate contractor payments, API spending, allowance management via Tessera.
3. **DAOs** — agent-driven grant distribution and operations under transparent on-chain policy.
4. **API providers** — adopt our middleware (`@auranode/x402-arc/server`) to monetize per-call instead of subscription. Already drop-in for Express; Hono, Fastify, FastAPI/Python in v1.0 roadmap.

### Indirect (network effect)
- Every Tessera position = USDC parked on Arc (TVL)
- Every Acta receipt = downstream lending/credit signal (usable by Aave, Maple, Morpho on Arc)
- Every Honos bond = reputation that other dApps integrate (services skip escrow for high-rep agents)

---

## Team

**Taufik (auranode.xyz)** — solo builder. Indonesian Web3 builder + validator operator. Background: TypeScript / Solidity / Node. Validator experience for multiple chains (Story Protocol, Aztec, Gensyn, Zenrock). Operating multiple production services already (Halcyon, Akasha, TTS, n8n) on dedicated VPS.

**Why solo execution is credible here:**
- Already shipped v0.1 to production in 9 days
- Operating production HTTPS + Docker + Nginx services
- 36 unit tests + on-chain proofs already in
- Clear roadmap with weekly milestones in repo

---

## Funding Use

Grant funding will accelerate v0.2 → v1.0:

- **Audit (Sherlock or Spearbit):** $30k for Tessera + Honos contracts before mainnet
- **Hetzner / Netcup VPS scaling:** $1k/yr for redundant facilitator nodes (multi-region)
- **Builder engagement:** $5k for Indonesian / SEA developer onboarding (Bahasa-language docs, hackathon participation)
- **Lit Protocol / Privy / Turnkey integration testing:** $3k for production custody verification
- **Mainnet deployment costs:** $2k operational reserve when Arc mainnet beta opens
- **Open-source tooling time:** opportunity cost of 3 months full-time development → ~$30k

Estimated ask: **$25k–50k USDC** (mid-tier of Circle's $5k–$100k range).

---

## Roadmap

| Phase | Date | Deliverable |
|---|---|---|
| v0.1 | 2026-05-08/09 | TalosFacilitator live ✅ |
| v0.2 (in progress) | 2026-05-12 to 2026-05-26 | Tessera + Honos + Acta on Arc Testnet |
| v0.3 | 2026-05-27 to 2026-06-09 | Custody adapter (Lit + ERC-4337) + Mitra Agent SDK |
| Audit | 2026-Q3 | Sherlock/Spearbit engagement |
| Mainnet | 2026-Q3-Q4 | When Arc mainnet beta opens |
| Multi-chain | 2026-Q4 | Ink + Base deployments |

---

## Why Aureus Wins for Arc

Aureus is **the only product in the Arc ecosystem that addresses the AI agent commerce gap end-to-end**:

| Need | Today | Aureus |
|---|---|---|
| x402 settlement on Arc | none | ✅ TalosFacilitator |
| Programmable agent spending | manual ERC-20 approve | ✅ Tessera |
| Agent reputation as collateral | non-existent | ✅ Honos |
| Audit-grade receipts | manual logs | ✅ Acta |
| Custody for autonomous agents | hot keys (insecure) or full delegation | ✅ Custody adapter |

Other Arc builders ship DEXs, perps, AMMs. Aureus ships **the substrate** — the layer those builders' agents will spend through. We don't compete with them; we make them more useful.

---

## Open Source Commitment

- **License:** MIT for all packages, contracts, and documentation
- **Repository:** github.com/hidayahhtaufik/aureus (public, all commits visible)
- **Standards track:** Tessera, Honos, Acta designed as candidate ERC standards. We will draft EIPs after audit.
- **Upstream contribution:** v0.2 includes a PR to x402-foundation/x402 adding Arc as a default-asset network.

---

## Contact

- **Email:** hello@auranode.xyz
- **GitHub:** [@hidayahhtaufik](https://github.com/hidayahhtaufik)
- **Brand:** [auranode.xyz](https://auranode.xyz)
- **X/Twitter:** (provide handle)
- **Discord:** (Arc Discord — provide handle)

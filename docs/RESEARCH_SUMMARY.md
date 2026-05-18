# AUREUS — Research Summary (Tech Landscape, May 2026)

**Compiled:** 2026-05-12
**Purpose:** Preserve research findings that drove the SaaS pivot. Reference before revisiting decisions.

---

## Arc Network (Circle's L1 Stablecoin Chain)

### Confirmed shipped
- **Public testnet** live since Oct 28, 2025
- **Chain ID:** 5042002 (0x4cef52), currency symbol: USDC
- **Explorer:** https://testnet.arcscan.app/ (Blockscout)
- **Consensus:** Malachite BFT (Rust, Tendermint-family, built by Informal Systems → acquired by Circle)
  - ~780ms finality at 100 validators with 1MB blocks
  - ~3,000 TPS at 20 validators with <350ms finality (Arc-published benchmarks)
- **Execution layer:** Reth (Rust Ethereum client)
- **EVM compatibility:** Standard Foundry/Hardhat/Viem works. EVM-differences doc page returned 404 — verify precompile parity before relying on byte-for-byte equivalence
- **USDC as native gas:** Formula `fee = gas_units × base_fee_in_USDC`, EWMA-adjusted, target ~$0.01 per transaction
- **USDC contract:** `0x3600000000000000000000000000000000000000`
- **CCTP V2:** Domain 26, TokenMessenger at `0x8FE6...2DAA`
- **Gateway Wallet:** `0x0077...19B9`
- **Gateway Minter:** `0x0022...475B`
- **FxEscrow (StableFX):** `0x8676...a9f8` (live testnet)
- **Permit2:** `0x0000...8BA3` (canonical address)
- **EURC, USYC** also deployed on testnet
- **Anthropic** listed as Arc partner — Claude Code + dev tools integration

### NOT shipped (roadmap)
- Privacy primitives (confidential transfers via TEE) — Phase 1 roadmap
- View keys for auditors/regulators — roadmap
- MPC/FHE/ZK privacy backends — future phases
- PoS (currently PoA with vetted institutional validators) — May 8, 2028 hard deadline per investor terms
- Post-quantum signatures — planned at mainnet
- Compliance Engine on-chain — no contract address yet
- Validator roster names — not published

### Token (ARC)
- **Total supply:** 10,000,000,000 ARC
- **Allocation:** Circle 25% / Ecosystem 60% / Long-term reserve 15%
- **Presale May 11, 2026:** 740M ARC sold at $0.30 = $222M raised, $3B FDV
- **Lead investor:** a16z crypto $75M
- **Other investors:** BlackRock, Apollo, ICE, SBI, Janus Henderson, Standard Chartered Ventures, General Catalyst, Marshall Wace, ARK Invest, IDG Capital, Haun Ventures, Bullish
- **Utility:** governance, staking (future PoS), fee conversion+burn
- **NOT mandatory:** gas is in USDC. ARC only needed for stake/govern
- **TGE date:** not announced
- **Unlock schedules:** not public

### Standards
- **ERC-8004:** Onchain agent identity (DID-like registry) — Arc supports
- **ERC-8183:** Job escrow & settlement — Arc supports
- **Arc MCP Server** — native, listed in docs/llms.txt
- **App Kit SDK:** Bridge / Swap / Send / Unified Balance

### Partner ecosystem
200+ design-phase partners across:
- Banks: BlackRock, Goldman Sachs, HSBC, Deutsche Bank, Standard Chartered, BNY Mellon, State Street, Invesco, Apollo
- Payments: Visa, Mastercard, WorldPay, Brex, Nuvei
- Stablecoin issuers: JPYC (JP), BRLA (BR), MXNB (MX), PHPC (PH), KRW1 (KR), Forte AUD, Stablecorp
- DeFi: Aave, Curve, Uniswap Labs, Euler, Morpho
- Wallets: MetaMask, Ledger, Fireblocks, Privy, Turnkey
- Exchanges: Coinbase, Kraken, Bybit, Robinhood, Hashkey
- Infra: AWS, Cloudflare, Chainlink, Alchemy, **Anthropic**, thirdweb, LayerZero

**Indonesian/SEA:** Coins.ph (PHPC) is the only SEA partner. **No IDR stablecoin on Arc.** Open lane for Indonesian builder, but settlement still hits regulatory red lines if domestic Indonesian users.

### Mainnet timeline
- **Mainnet beta target:** summer 2026 (Ledger Insights)
- No firm date confirmed

### Risks
1. Centralization at genesis (Circle 25% supply, runs validators)
2. Token unlock cliff (2027-2028 plausible, not public)
3. PoA validator opacity (no roster published)
4. Regulatory: GENIUS Act final rules by July 2026; MiCA full enforcement July 1, 2026
5. EVM compatibility unknowns (verify precompiles)

---

## Circle (Q1 2026)

### Earnings
- Revenue: $694M (+20% YoY, missed $715M consensus)
- USDC circulation: $77B (+28% YoY)
- On-chain transaction volume: $21.5T (+263% YoY)
- Adjusted EBITDA: $151M (+24%)
- EPS: $0.21 (beat $0.19)

### Strategic narrative (Allaire to investors)
- "Largest platform shift in the history of the internet" — AI + stablecoins convergence
- USDC = 99.8% of all x402 protocol transactions
- x402 processed $24.24M in 30 days prior to April 29, 2026
- 85% of Circle employees weekly active on AI coding tools
- 600+ AI-native apps deployed internally

### Agent Stack (launched May 11, 2026)
- **Agent Wallets:** 2-of-2 MPC with policy engine (time-bound limits, allowlists). Powered by Circle's user-controlled wallets infra
- **Agent Marketplace:** Curated at agents.circle.com (review process opaque, no public submission form)
- **Circle CLI:** `npm install -g @circle-fin/cli` — wallet/identity mgmt, x402 paid services, contract calls
- **Circle Skills:** Apache 2.0, github.com/circlefin/skills — 15 skills shipped
  - use-arc, use-agent-wallet, pay-via-agent-wallet, fund-agent-wallet, agent-wallet-policy
  - use-usdc, bridge-stablecoin, use-gateway, swap-tokens
  - use-circle-wallets, use-developer-controlled-wallets, use-user-controlled-wallets, use-modular-wallets
  - use-smart-contract-platform, use-circle-cli
- **Nanopayments:** Live mainnet on 11 chains (NOT Arc — Arc still testnet). Min $0.000001 USDC, <1s verification
- **`@circle-fin/x402-batching` v3.0.4** (npm):
  - Arc Testnet supported
  - Express middleware `createGatewayMiddleware({ sellerAddress })`
  - Client API `GatewayClient` with private key signing
  - License: unverified (npm 403'd, likely Apache 2.0 like Skills)
  - Weekly downloads: ~1,079

### Developer Grants (OPEN)
- **Funding:** $5K-$100K USDC tiered, milestone-based
- **Application:** circle.questbook.app
- **Priority verticals 2026:**
  1. Agentic economic activity ← matches AUREUS
  2. Stablecoin FX
  3. P2P payments
  4. Treasury management
  5. Prediction markets
  6. Lending and borrowing
- **Path:** Grant → Circle Ventures referral
- **Recent recipients (2026 Cohort 1):** 19 startups including 8 African-founded (Flipeet Raise, LINK, Scalex, SFx, Katika)

### Arc Builders Fund
- **Apply:** arc.network/builders-fund (waitlist)
- **Investor syndicate:** 25+ firms (Dragonfly, Electric Capital, Haun, Lightspeed, DCG, 500 Global, Breyer)
- **Focus verticals:**
  1. Always-on markets (perp DEXs, prediction markets)
  2. Offchain assets / credit markets (RWAs)
  3. FX
  4. **Agentic commerce** ← matches AUREUS
  5. Energy/compute (IoT)
- **Confirmed participant:** Hibachi (FX trading venue on Arc, announced Feb 12, 2026)

### Regulatory context
- **GENIUS Act:** Signed into law July 18, 2025. Effective ~Nov 2026. Service providers can sell non-permitted stablecoins until July 2028. USDC has clear federal compliance moat.
- **MiCA:** Circle France received AMF approval April 20, 2026. Full MiCA enforcement July 1, 2026.
- **Indonesia (OJK/BI):** Crypto authority transferred Bappebti → OJK Jan 10, 2025 (POJK 27/2024 + POJK 23/2025). Stablecoins NOT legal as payment instruments. AUREUS positioning: agent-to-agent, cross-border, no domestic IDR.

---

## Gensyn AI (Mainnet, April 2026)

### Network
- **Mainnet live:** April 22, 2026 on OP Stack L2
- **Token AI:** TGE April 29, 2026. Buy-and-burn live May 1, 2026
- **Validators:** Stake `AI`, slashable

### REE (Reproducible Execution Environment)
- Containerized AI inference (Docker, OCI)
- 3 modes: `default` / `deterministic` / `reproducible` (bitwise-identical across hardware)
- **Receipt is HASH thumbprint, NOT signed cryptographic proof**
- `receipt.json` fields: model_name, commit_hash, config_hash, prompt_hash, parameters_hash, tokens_hash, receipt_hash, etc.
- **No verifier smart contract.** Verification via local CLI: `validate` (recomputes hashes) + `verify` (re-runs inference)
- **License:** Mixed — SDK MIT, compiler binary + RepOp kernels proprietary
- **No third-party audit** disclosed for Gensyn L2 contracts

### AXL (Agent eXchange Layer)
- P2P binary in Go 1.25.5+
- Local HTTP API on `localhost:9002`: `/send`, `/recv`, `/topology`, `/mcp/{peer_id}/{service}`, `/a2a/{peer_id}`
- Encryption: TLS + Yggdrasil (NOT libp2p)
- Discovery: Yggdrasil mesh, manual peer bootstrap (no DHT)
- **No release tags**, no LICENSE file (uncertain license)
- **Experimental** — do NOT put on AUREUS v0.3 critical path

### Delphi (AI prediction markets)
- Mainnet live April 22, 2026
- USDC settlement
- TypeScript SDK `@gensyn-ai/gensyn-delphi-sdk`
- Single venue only — skip for AUREUS v0.1-v0.4

### AUREUS integration angle
- **v0.5:** Acta wraps REE receipt hash → "verifiable AI inference receipts"
- AXL: monitor stability, integrate v0.6+ if matures

---

## Boundless (ZK Proof Market, RISC Zero)

### Current state
- **Mainnet:** Base only (since Sept 12, 2025)
- **Multi-zkVM (SP1, Boojum, Jolt):** ROADMAP, not live
- **~110 provers**, ~400 trillion cycles/day capacity
- **Pricing:** $0.04-$0.17 per batch proof (vendor claim, unaudited)
- **Token ZKC:** prover collateral. Requestors pay in chain native token (ETH on Ethereum, ETH on Base)

### Arc support
- **NOT supported.** Verifier contracts deployed only on Ethereum, Base, Taiko
- AUREUS would need to self-deploy `RiscZeroVerifierRouter` on Arc (open source)

### Bonsai termination
- December 2025 — RISC Zero killed hosted Bonsai
- Boundless is official replacement
- **Migration:** centralized API → decentralized market = real re-architecture

### AUREUS integration angle
- **v0.6+:** Batch verifiable agent decisions (1 proof per N decisions)
- Cost realism: $0.04-0.17/batch affordable for high-value, NOT for per-decision micropayments
- Effort: 3-5 weeks POC if Rust-comfortable

---

## Lit Protocol

### CRITICAL: Naga V1 is SUNSET
- Naga V1 mainnet: Dec 17, 2025 → SUNSET April 1, 2026
- **Current:** Lit V3 "Chipotle" launched April 1, 2026
- V0 Datil → V1 Naga → V3 Chipotle in **6 months** — architecture churn risk

### V3 Chipotle
- **TEE-based** (NOT threshold MPC — materially weaker decentralization claim)
- Each request runs in one TEE enclave
- REST API primary, JS SDK secondary
- Pricing: $0.01/sec write, free reads, $5 credit minimum
- Token: $LITKEY on Base

### PKPs (Programmable Key Pairs)
- ECDSA secp256k1 EVM-compatible
- Owner auth: SIWE, OAuth, passkeys, custom Lit Actions
- Cost: not published clearly in V3

### Vincent
- Live Early Access — agent wallet + app store on Lit
- TVL ~$500K (small)
- Repo: github.com/LIT-Protocol/Vincent

### AUREUS integration angle
- **DEFER:** V3 just shipped 6 weeks ago. Don't build core custody on infra with fundamental architecture change. Wait 1-2 quarters.
- If needed: programmable signing via Lit Action when policy expressiveness matters more than Lit's churn

---

## Ink Onchain (Kraken's L2)

### Confirmed state
- **Mainnet live:** Dec 17-18, 2024
- **TVL growth:** ~$7M (Oct 2025) → ~$450M (early 2026)
- **Stack:** OP Stack, Optimism Superchain
- **Chain ID:** 57073 (`0xdef1`)
- **ETH for gas** (no proprietary gas token)
- **Native USDC + CCTP V2:** deployed Sept 25, 2025
- **USDC contract:** `0x2D270e6886d130D724215A266106e6832161EAEd`
- **EIP-3009 support:** likely yes (FiatToken v2.2 default), **VERIFY before depending**

### INK token
- TGE expected Q2-Q3 2026
- 1B fixed supply
- First point batch dropped Apr 13, 2026
- Eligibility: Kraken Pro trading + Tydro Season 2 + Nado DEX activity

### Kraken funnel
- ~13M verified clients globally
- Funneling to Ink via Tydro trading rewards
- **Captive demand for x402 facilitator on Ink — NO facilitator deployed yet**

### Block explorer
- https://explorer.inkonchain.com (Blockscout)
- Docs: https://docs.inkonchain.com

### AUREUS integration angle
- **Phase C (v0.4):** Deploy facilitator + contracts to Ink as second chain
- Effort: 1-2 weeks redeploy
- Positioning: "Arc + Ink — only facilitator covering Circle institutional L1 + Kraken retail L2"

---

## Other Tech Landscape (May 2026)

### Standards war — the elephant in the room

| Standard | Backers | Volume |
|---|---|---|
| **x402** | Coinbase, Anthropic | 169M tx, $24.24M/mo recent |
| **MPP (Machine Payments Protocol)** | Stripe, Paradigm (Tempo) | New, payment-agnostic |
| **AP2 (Agent Payments Protocol)** | Google A2A, 60+ payment orgs | Enterprise reach |

All revive HTTP 402. **AUREUS bet x402 (volume leader), abstract settlement layer for future MPP/AP2 adapters.**

### Competitor chains
- **Tempo (Stripe + Paradigm):** mainnet March 18, 2026. MPP launched. $500M raise at $5B FDV.
- **Plasma (Tether/USDT):** mainnet live. USDT-native. Billions in volume.
- **Codex:** institutional services live in PH, expanding SG/UK/UAE/HK.

### Custody alternatives (for v0.4+ adapters)
- **Circle dev-controlled wallets:** mature, Arc testnet supported
- **Turnkey:** TEE-based, agentic focus, 50-100ms signing, no Anthropic-Skills-like distribution
- **Privy:** Stripe-acquired June 2025. Embedded wallets. Arc support unconfirmed.
- **Pimlico ERC-4337:** mature, Arc support unconfirmed
- **Coinbase Agentic Wallets:** TEE-secured, AWS Bedrock integration May 2026

### Anthropic ecosystem
- **MCP:** open-sourced Nov 2024, donated to Linux Foundation Dec 2025. Latest spec 2025-11-25.
- **150+ orgs** adopt MCP. **Google A2A** = 150+ orgs, 22K+ stars, 5 language SDKs.
- **Circle Skills (Apache 2.0)** = production model AUREUS should follow
- **Claude API:** latest Opus 4.7 (1M context, $5/$25 per 1M), supports adaptive thinking, Skills, MCP

### Indonesian regulatory red lines
- POJK 27/2024 (refined by POJK 23/2025): crypto = digital financial asset
- **Stablecoins NOT legal as payment instruments** (BI lobby ongoing)
- 19 DFA trader licenses issued March 2025
- AUREUS positioning: agent-to-agent, USDC-only, cross-border = ALL clear of POJK red lines

---

## Three Architect Questions Before Building on Arc

1. **What part of my workload survives if privacy and PoS slip past 2028?**
   AUREUS answer: Honos + Acta + Tessera work without Arc privacy. Migrate to other EVM if needed.

2. **Am I locked into Circle's stack, or is my contract truly portable?**
   AUREUS answer: Built to ERC standards (8004, 8183, 3009). EVM-portable. Multi-chain abstraction from day 1.

3. **What's my answer to the Indonesian regulator when they ask why USDC settled my user's payroll?**
   AUREUS answer: Not user's payroll. Agent-to-agent commerce. Cross-border. USDC only. No domestic IDR ever.

---

## Sources (Key URLs)

### Arc
- https://www.arc.network/ — landing
- https://docs.arc.network/ — docs
- https://testnet.arcscan.app/ — explorer
- https://chainlist.org/chain/5042002

### Circle
- https://www.circle.com/pressroom/circle-launches-ai-infrastructure-to-power-the-agentic-economy
- https://developers.circle.com/agent-stack/agent-wallets
- https://www.circle.com/grant
- https://circle.questbook.app/ — grant application
- https://github.com/circlefin/skills
- https://www.npmjs.com/package/@circle-fin/x402-batching

### Gensyn
- https://docs.gensyn.ai/
- https://github.com/gensyn-ai/ree
- https://github.com/gensyn-ai/axl
- https://blog.gensyn.ai/delphi/

### Boundless
- https://docs.boundless.network/
- https://explorer.boundless.network/

### Lit
- https://spark.litprotocol.com/lit-v3-is-live-confidential-compute-and-key-management-in-one-api/

### Ink
- https://docs.inkonchain.com/
- https://explorer.inkonchain.com/

### News
- https://www.cnbc.com/2026/05/11/circle-closes-222-million-from-blackrock-apollo-for-arc-blockchain.html
- https://www.theblock.co/post/400709/
- https://decrypt.co/367386/

---

**End of research summary. Reference before any decision that touches an external dependency.**

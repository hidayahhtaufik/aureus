<div align="center">

# 🜚 Aureus Protocol

### The first community x402 facilitator for **Arc Network**

Stablecoin-native HTTP payments · sub-second settlement · USDC-as-gas

[![CI](https://github.com/hidayahhtaufik/aureus/actions/workflows/test.yml/badge.svg)](https://github.com/hidayahhtaufik/aureus/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-success)](https://nodejs.org)
[![Arc Testnet](https://img.shields.io/badge/Arc-Testnet%205042002-orange)](https://docs.arc.network)
[![x402](https://img.shields.io/badge/x402-spec--compliant-purple)](https://x402.org)
[![Status: live](https://img.shields.io/badge/status-live-success)](https://aureus.auranode.xyz)

**Public facilitator** · [aureus.auranode.xyz](https://aureus.auranode.xyz) &nbsp;·&nbsp;
**Builder** · [auranode.xyz](https://auranode.xyz) &nbsp;·&nbsp;
**Network** · Arc Testnet `5042002`

</div>

---

## What is Aureus?

**x402** is the HTTP `402 Payment Required` protocol revived for the agentic-internet era — every API call can carry a signed micropayment in its headers, no API keys, no monthly bills. It lives natively on **Base · Solana · Algorand · Stellar**.

It did **not** live on Arc.

Aureus changed that. **TalosFacilitator** is the first community x402 facilitator for Arc Network, implementing the [x402 spec](https://github.com/x402-foundation/x402) against Arc's native USDC token with full EIP-3009 `transferWithAuthorization` support — no proxy contract needed.

**Why it matters:** Arc's stablecoin-native gas (USDC) + sub-second BFT finality + cheap fees make it the first L1 where per-API-call micropayments are economically viable at machine speed. Aureus is the rail that connects HTTP requests to on-chain settlement on that rail.

> 🏆 **First on-chain x402 settlement on Arc** — [`0x401ff5…136f`](https://testnet.arcscan.app/tx/0x401ff57311fe103e7215a26490d6c8ee6cc91604688e450f2fccc7f12daf136f) (2026-05-08, local end-to-end)
>
> 🏆 **First settlement via the public facilitator** — [`0x473d42…38a8`](https://testnet.arcscan.app/tx/0x473d4278e5f15eec18bbe8dd3bc4057f8f4339af41fea67374c282e5e33838a8) (2026-05-09, HTTPS + Nginx + Docker)

---

## How it works

```
┌──────────┐   ① GET /api/foo (no payment)            ┌──────────┐
│  Buyer   │ ───────────────────────────────────────▶ │  Seller  │
│  Agent   │ ◀─────────────────────────────────────── │ (your API)│
└────┬─────┘   ② 402 + paymentRequirements           └─────┬────┘
     │ ③ sign EIP-3009                                     │
     │   transferWithAuthorization                         │
     │                                                     │
     │   ④ GET /api/foo                                    │
     │      X-PAYMENT: base64(payload)                     │
     ▼                                                     ▼
     ──────────────────────────────────────────────────────┐
                                                            ▼
                                              ┌───────────────────────┐
                                              │   TalosFacilitator    │
                                              │  POST /verify         │
                                              │  POST /settle ──────────────▶ Arc Testnet
                                              │                       │       USDC.transferWith
                                              │                       │       Authorization()
                                              └───────────────────────┘       (sub-second BFT)
                                                       │
                                              ⑤ 200 OK + content
                                              ⑥ X-PAYMENT-RESPONSE = tx hash
```

The buyer (agent) signs an EIP-3009 authorization once per call. The facilitator verifies the signature, broadcasts on Arc, and returns a tx hash. **Zero new payment infra** — USDC is the rail.

---

## Repository

```
aureus/
├── facilitator/         ← TalosFacilitator Hono service (the x402 implementation)
│   ├── src/             ← /verify · /settle · /supported routes
│   ├── test/            ← 36 vitest unit tests · 0 typecheck errors
│   ├── Dockerfile       ← production container
│   └── README.md
│
├── examples/
│   ├── buyer/           ← Node agent — signs + auto-pays a paid endpoint
│   └── seller/          ← Express server — protects /api/weather behind x402
│
├── packages/
│   └── x402-arc/        ← Shared SDK (EIP-3009 signer + payment-payload codec)
│
├── src/                 ← v0.2 contracts (Acta · Honos · Tessera) — see ROADMAP
├── test/                ← Foundry probes verifying EIP-3009 on Arc USDC (6 cases)
│
├── deploy/
│   ├── DEPLOYMENT.md            ← step-by-step production runbook
│   └── aureus.auranode.xyz.conf ← reference Nginx config
│
├── docs/
│   ├── ARCHITECTURE.md          ← deep-dive on verifier + settler design
│   ├── PRODUCT_SPEC.md
│   ├── ROADMAP.md               ← v0.2 + Circle Grant milestone plan
│   ├── grant-application.md
│   └── ADRs/                    ← architecture decision records
│
├── docker-compose.yml
└── foundry.toml
```

---

## Quickstart — run the whole stack locally in 90 seconds

You'll need: **Node ≥ 20**, **npm**, a fresh testnet wallet, and a small amount of Arc Testnet USDC (claim from [faucet.circle.com](https://faucet.circle.com)).

```bash
git clone https://github.com/hidayahhtaufik/aureus.git
cd aureus
npm install
```

### 1. Facilitator (terminal A)

```bash
cd facilitator
cp .env.example .env
# Edit .env, set FACILITATOR_PRIVATE_KEY=0x...
npm run dev   # → http://localhost:8402
```

Verify:

```bash
curl -s http://localhost:8402/health           # → {"ok":true,...}
curl -s http://localhost:8402/supported | jq   # → {"kinds":[{"scheme":"exact","network":"eip155:5042002",...}]}
```

### 2. Seller (terminal B)

```bash
cd examples/seller
cp .env.example .env
# Edit .env, set SELLER_ADDRESS to where you want USDC sent
npm run dev   # → http://localhost:8403
```

Try without payment:

```bash
curl -i http://localhost:8403/api/weather
# → HTTP/1.1 402 Payment Required
# → { "x402Version":1, "paymentRequirements":[...] }
```

### 3. Buyer (terminal C)

```bash
cd examples/buyer
cp .env.example .env
# Edit .env, set BUYER_PRIVATE_KEY to a wallet with Arc Testnet USDC
npm run buy
```

You'll see:

```
[buyer] GET /api/weather → 402
[buyer] Signing EIP-3009 for 0.01 USDC...
[buyer] Retrying with X-PAYMENT header...
[buyer] ✓ 200 OK
[buyer]   tx: 0xabc…def (https://testnet.arcscan.app/tx/0xabc…def)
[buyer]   weather: { city: "Jakarta", temp: 31, ... }
```

That's the full loop: HTTP 402 → sign → settle on Arc → content served, in **one round-trip**.

---

## Use the public facilitator

Already deployed at **https://aureus.auranode.xyz**. Skip the local facilitator and point your seller at it:

```bash
# In examples/seller/.env
FACILITATOR_URL=https://aureus.auranode.xyz
```

Or from a script:

```bash
curl -s https://aureus.auranode.xyz/supported | jq
```

The public facilitator pays its own Arc gas in USDC out of a dedicated wallet — your seller doesn't need to fund anything but its own receive address.

---

## Architecture (v0.1)

| Component | What |
|---|---|
| **Path** | EIP-3009 `transferWithAuthorization` — no proxy contract, no allowance step |
| **Stack** | Hono + Viem + Zod + TypeScript strict + Vitest |
| **Verifier** | 10-step chain: scheme · network · asset · `from` recovery · balance · nonce · time-window · amount · domain · header round-trip |
| **Settler** | `simulate → broadcast → wait receipt` — single Arc Testnet tx per call |
| **Tests** | 36 unit tests · 0 typecheck errors · CI on every push |

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the deep-dive.

### Per-tx economics on Arc Testnet

| Item | Value |
|---|---|
| Per-call payment | `0.01 USDC` (configurable) |
| Arc gas (paid in USDC by facilitator) | `~$0.0019` |
| Total cost to seller per call | `~$0.0119` |
| Confirmation time | `< 1 s` (Malachite BFT) |
| Tx finality | immediate |

That's what makes Arc the first chain where per-API-call micropayments aren't laughed out of the cost model.

---

## Deploy to your own VPS

Full step-by-step runbook in [`deploy/DEPLOYMENT.md`](./deploy/DEPLOYMENT.md) — covers DNS, Docker, Nginx, Let's Encrypt, certbot auto-renewal, smoke tests.

TL;DR on a freshly-cloned VPS:

```bash
cd /var/www/aureus/facilitator
cp .env.example .env  # set FACILITATOR_PRIVATE_KEY
cd /var/www/aureus
sudo docker compose up -d --build
sudo docker logs -f aureus-facilitator
```

Front it with Nginx + certbot using the included [`deploy/aureus.auranode.xyz.conf`](./deploy/aureus.auranode.xyz.conf).

---

## Roadmap

### v0.1 — **shipped** ✅
- [x] Foundry probes verifying EIP-3009 on Arc USDC (6 cases)
- [x] TalosFacilitator service with `/verify`, `/settle`, `/supported`
- [x] 36 vitest unit tests (verifier · settler · routes · scheme)
- [x] Buyer + seller demo apps
- [x] Production deploy at `aureus.auranode.xyz`
- [x] Docker compose + Nginx + certbot runbook

### v0.2 — primitives (Circle Grant scope)
- [ ] **Tessera** — programmable USDC spending policies (per-call cap, daily budget, allowlist) — `src/Tessera.sol` drafted
- [ ] **Honos** — decaying-bond agent reputation, pledgeable + slashable — `src/Honos.sol` drafted
- [ ] **Acta** — semantic action receipts: chain `intent → outcome` across multi-agent flows — `src/Acta.sol` drafted

See [`docs/ROADMAP.md`](./docs/ROADMAP.md) for the full milestone plan and the [`docs/grant-application.md`](./docs/grant-application.md) for Circle Developer Grant context.

### v0.3 — ecosystem
- [ ] Publish `@auranode/x402-arc` SDK to npm
- [ ] x402-foundation PR — Arc as a first-class scheme in the spec's network list
- [ ] Reference seller library for Express/Fastify/Hono middleware
- [ ] Buyer library: drop-in fetch wrapper that auto-pays 402s

---

## Why x402 on Arc, specifically?

| Chain | USDC native? | Gas-in-USDC? | Sub-sec finality? | Avg fee | x402 facilitator |
|---|---|---|---|---|---|
| Ethereum L1 | yes | no (ETH) | no | $0.50–$5 | n/a — fees > payment |
| Base | yes | no (ETH) | no (~2s) | $0.001–$0.01 | yes (Coinbase) |
| Solana | bridged | no (SOL) | yes | <$0.001 | yes |
| **Arc Testnet** | **yes (precompile-style)** | **yes** | **yes (Malachite BFT)** | **~$0.002** | **🜚 Aureus** |

The economics line up: USDC-as-gas means a paid call's cost is dominated by the payment itself, not gas overhead. That's the wedge.

---

## Contributing

Issues + PRs welcome. v0.1 is intentionally minimal; v0.2 primitives (Acta · Honos · Tessera) are open for contributor design feedback before audit.

- Fork → branch → PR
- CI runs `forge build`, `forge fmt --check`, `forge test`, and the workspace `test` script
- Open issues for new x402 scheme support, alternative facilitator hosts, or integration ideas

---

## Related

- **x402 Specification** · [github.com/x402-foundation/x402](https://github.com/x402-foundation/x402)
- **Arc Network** · [arc.network](https://arc.network) · [docs.arc.network](https://docs.arc.network) · [arcscan.app](https://testnet.arcscan.app)
- **Circle Developer Grants** · [circle.com/grant](https://www.circle.com/grant)
- **Aureus builder** · [auranode.xyz](https://auranode.xyz)

---

<div align="center">

**License:** MIT · Built by [auranode.xyz](https://auranode.xyz) · `aureus@auranode.xyz`

</div>

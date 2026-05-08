# TalosFacilitator

> x402 facilitator service for Arc Network — part of [Aureus Protocol](../README.md).

**Status:** v0.1 Week 1 sprint complete — Real `/verify` + `/settle` shipping on-chain transactions on Arc testnet.

**First successful end-to-end settlement (2026-05-08):**
- Tx: [`0x401ff57...136f`](https://testnet.arcscan.app/tx/0x401ff57311fe103e7215a26490d6c8ee6cc91604688e450f2fccc7f12daf136f)
- 0.01 USDC transferred via `transferWithAuthorization`
- ~$0.0019 gas cost (USDC-as-gas confirmed)
- Sub-second confirmation

## Quickstart

```bash
cd facilitator

# Install deps
npm install

# Copy env file
cp .env.example .env

# Run dev server (auto-reload)
npm run dev
```

Server runs on `http://localhost:8402`.

## Endpoints

| Method | Path | Status | Description |
|---|---|---|---|
| GET | `/` | ✅ | Project info |
| GET | `/health` | ✅ | Health check |
| GET | `/supported` | ✅ | Supported networks + assets |
| POST | `/verify` | ✅ | Verify x402 payment payload (10-step chain) |
| POST | `/settle` | ✅ | Verify + settle on-chain via `transferWithAuthorization` |

## Test the Live Endpoints

```bash
# Project info
curl http://localhost:8402/

# Health check
curl http://localhost:8402/health

# Supported networks (the actual x402 endpoint)
curl http://localhost:8402/supported
```

Expected `/supported` response:

```json
{
  "kinds": [
    {
      "x402Version": 1,
      "scheme": "exact",
      "network": "eip155:5042002",
      "extra": {
        "name": "Arc Testnet",
        "asset": {
          "address": "0x3600000000000000000000000000000000000000",
          "decimals": 6,
          "symbol": "USDC",
          "eip712": { "name": "USDC", "version": "2" }
        }
      }
    }
  ]
}
```

## Architecture

- **Hono** — fast HTTP framework (chosen over Express for performance + TS-first DX)
- **Viem** — EVM client (chosen over ethers v6 for type safety + tree-shaking)
- **Zod** — runtime validation of x402 payloads
- **TypeScript strict** — every input/output typed

## Implementation Plan

- ✅ Day 4: Skeleton + `/supported` endpoint (this commit)
- 🔜 Day 5: `/verify` — EIP-712 signature recovery + balance check
- 🔜 Day 6: `/settle` — broadcast `transferWithAuthorization` to Arc
- 🔜 Day 7: End-to-end test with funded testnet wallet

## Why EIP-3009 Path (not Permit2)

See [`../RESEARCH.md`](../RESEARCH.md) §5 — Architecture Decision.

TL;DR: Arc USDC supports EIP-3009. No proxy contract needed, no audit, lower gas.

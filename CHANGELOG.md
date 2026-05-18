# Changelog

All notable changes to **Aureus Protocol** are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned (v0.2 — Circle Grant scope)
- **Tessera** — programmable USDC spending policies (per-call cap, daily budget, allowlist)
- **Honos** — decaying-bond agent reputation, pledgeable + slashable
- **Acta** — semantic action receipts: `intent → outcome` chain across multi-agent flows

### Planned (v0.3 — ecosystem)
- `@hidayahhtaufik/x402-arc` SDK published to npm
- x402-foundation PR adding Arc as a first-class scheme in the spec
- Express / Fastify / Hono / Bun middleware libraries
- Buyer drop-in `fetch` wrapper that auto-pays HTTP 402

---

## [0.1.0] — 2026-05-18

First public release. Production deployment live at https://aureus.auranode.xyz.

### Added
- **TalosFacilitator service** (`/facilitator/`)
  - `GET /` — service info
  - `GET /health` — health probe
  - `GET /supported` — CAIP-2-formatted supported scheme/network/asset list
  - `POST /verify` — 10-step verification chain on EIP-3009 payment payload
  - `POST /settle` — verify + broadcast `transferWithAuthorization` on Arc
  - 36 vitest unit tests covering verifier, settler, routes, scheme
- **`@hidayahhtaufik/x402-arc` SDK** (`/packages/x402-arc/`)
  - EIP-712 typed-data helpers
  - EIP-3009 signer
  - x402 payment-payload codec (base64 envelope)
  - Express middleware factory (peer-dep)
  - Arc Testnet constants (CAIP-2, USDC token, chain ID)
- **Buyer example** (`/examples/buyer/`) — Node agent that signs + auto-pays
- **Seller example** (`/examples/seller/`) — Express server with `/api/weather` paid endpoint
- **Foundry probes** (`/test/USDCTest.t.sol`) — 6 cases verifying EIP-3009 on Arc USDC
- **Production deployment** — Docker + Nginx + Let's Encrypt runbook in `/deploy/`
- **CI** — GitHub Actions runs `forge fmt --check`, `forge build`, `forge test`

### Verified milestones
- **First on-chain x402 settlement on Arc** — `0x401ff5…136f` (local end-to-end)
- **First settlement via the public facilitator** — `0x473d42…38a8` (HTTPS + Nginx + Docker)
- Per-tx economics confirmed: 0.01 USDC payment + ~$0.0019 Arc gas = ~$0.0119 total, sub-second BFT confirmation

### Architecture
- Path: EIP-3009 `transferWithAuthorization` (no proxy contract)
- Stack: Hono + Viem + Zod + TypeScript strict + Vitest
- Verifier: scheme → network → asset → `from` recovery → balance → nonce → time → amount → domain → header round-trip
- Settler: simulate → broadcast → wait receipt (single Arc tx per call)

---

[Unreleased]: https://github.com/hidayahhtaufik/aureus/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/hidayahhtaufik/aureus/releases/tag/v0.1.0

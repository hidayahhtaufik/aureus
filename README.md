# Aureus Protocol

> The golden standard for autonomous agent commerce on Arc Network.

**Status:** v0.1 — first community x402 facilitator for Arc Network. Live in production.

**Public facilitator:** https://aureus.auranode.xyz
**Builder:** [auranode.xyz](https://auranode.xyz)
**Network:** Arc Testnet (chain ID `5042002`)

---

## 🏆 Milestones

### First on-chain x402 settlement on Arc (2026-05-08)
[`0x401ff573...136f`](https://testnet.arcscan.app/tx/0x401ff57311fe103e7215a26490d6c8ee6cc91604688e450f2fccc7f12daf136f) — local facilitator end-to-end test.

### First settlement via public facilitator (2026-05-09)
[`0x473d4278...38a8`](https://testnet.arcscan.app/tx/0x473d4278e5f15eec18bbe8dd3bc4057f8f4339af41fea67374c282e5e33838a8) — full HTTPS + Nginx + Let's Encrypt + Docker stack.

### Per-tx economics
- 0.01 USDC transferred + ~$0.0019 gas = $0.0119 total
- Sub-second confirmation (Malachite BFT)
- USDC-as-gas thesis confirmed

---

## What is Aureus?

Aureus Protocol provides infrastructure for autonomous agent commerce on Circle's Arc Network. The first deliverable is **TalosFacilitator** — an open-source [x402](https://x402.org) payment facilitator for Arc.

x402 was live on Base, Solana, Algorand, Stellar — but **NOT Arc**. This repo changed that.

## Repository Layout

```
aureus/
├── RESEARCH.md              ← Day 3 research notes (10 sections, ~6000 words)
├── foundry.toml             ← Foundry config
├── test/USDCTest.t.sol      ← Day 2: 6 probes verifying EIP-3009 on Arc USDC
└── facilitator/             ← TypeScript x402 facilitator service
    ├── src/                 ← Hono + Viem + Zod + TypeScript strict
    ├── test/                ← 36 Vitest unit tests
    └── scripts/             ← End-to-end test driver
```

## Architecture (v0.1)

- **Path:** EIP-3009 `transferWithAuthorization` (no proxy contract needed)
- **Stack:** Hono + Viem + Zod + TypeScript strict + Vitest
- **Verifier:** 10-step chain (signature recovery, balance, nonce, time, amount, scheme/network/asset checks)
- **Settler:** simulate → broadcast → wait receipt
- **Tests:** 36 unit tests, 0 typecheck errors

## Quickstart

### Foundry — verify Arc USDC supports EIP-3009

```bash
forge build
forge test -vv
```

### Facilitator service

```bash
cd facilitator
npm install
cp .env.example .env  # edit with your testnet wallet private key
npm run dev           # boots http://localhost:8402
```

### Run the end-to-end test

```bash
# In another terminal
cd facilitator
npm run send          # signs + POSTs to /verify + /settle, observes tx hash
```

## Roadmap

- [x] **Week 1**: research, EIP-3009 verification, real /verify + /settle, 36 tests, end-to-end on-chain
- [ ] **Week 2**: deploy public facilitator, publish npm package, build demo seller
- [ ] **Week 3**: demo video, Discord/X content, x402-foundation/x402 PR
- [ ] **Week 4**: Circle Developer Grants application, Arc Builder Spotlight

## v0.2 (post-grant)

- **Tessera** — constrained USDC primitive (programmable spending policy)
- **Honos** — reputation bond (decaying, slashable, pledge-able)
- **Acta** — semantic action receipts (intent → outcome chain)

## License

MIT

## Related

- [x402 Specification](https://github.com/x402-foundation/x402)
- [Arc Network](https://arc.network) · [Arc Docs](https://docs.arc.network)
- [Circle Developer Grants](https://www.circle.com/grant)

# Aureus Protocol — Research Notes

**Project:** TalosFacilitator (x402 Facilitator for Arc Network)
**Phase:** v0.1 Research
**Last Updated:** 2026-05-08
**Builder:** [auranode.xyz](https://auranode.xyz)

---

## 1. Goal

Enable [x402](https://x402.org) HTTP-native micropayments on [Arc Network](https://arc.network) — Circle's stablecoin-native L1 — by building the first community facilitator implementation.

Currently x402 supports Base, Solana, Algorand, Stellar — but **NOT Arc**. We're filling that gap.

## 2. Network: Arc Testnet

| Property | Value |
|---|---|
| Chain ID | `5042002` |
| CAIP-2 | `eip155:5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Faucet | `https://faucet.circle.com` |
| Native gas token | **USDC** (NOT ETH — Arc is stablecoin-native) |
| Finality | Sub-second deterministic (Malachite BFT consensus) |

## 3. Key Contract Addresses (Arc Testnet)

| Contract | Address |
|---|---|
| USDC | `0x3600000000000000000000000000000000000000` |
| EURC | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` |
| USYC | `0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C` |
| USYC Entitlements | `0xcc205224862c7641930c87679e98999d23c26113` |
| USYC Teller | `0x9fdF14c5B14173D74C08Af27AebFf39240dC105A` |
| **Permit2 (canonical)** | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| CCTP V2 TokenMessenger | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` |
| CCTP V2 MessageTransmitter | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` |
| CCTP V2 TokenMinter | `0xb43db544E2c27092c107639Ad201b3dEfAbcF192` |
| CCTP V2 Message | `0xbaC0179bB358A8936169a63408C8481D582390C4` |
| Gateway Wallet | `0x0077777d7EBA4688BDeF3E311b846F25870A19B9` |
| Gateway Minter | `0x0022222ABE238Cc2C7Bb1f21003F0a260052475B` |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |

Source: [docs.arc.network/arc/references/contract-addresses](https://docs.arc.network/arc/references/contract-addresses)

## 4. Test Results — Day 2 (2026-05-08)

Full test suite at `test/USDCTest.t.sol`. Forks Arc testnet via RPC.

| Test | Result | Notes |
|---|---|---|
| `test_01_USDC_HasCode` | ✅ PASS | 1798 bytes bytecode (standard contract, not precompile) |
| `test_02_USDC_StandardERC20` | ⚠️ PARTIAL | name/symbol/decimals work; `totalSupply()` reverts |
| `test_03_USDC_EIP712Domain` | ✅ PASS | DOMAIN_SEPARATOR + version="2" present |
| `test_04_USDC_EIP3009Support` | ✅ **PASS** | `authorizationState()` works — **EIP-3009 SUPPORTED** |
| `test_05_Permit2_Deployed` | ✅ PASS | 9152 bytes bytecode at canonical address |
| `test_06_Permit2_Domain` | ✅ PASS | Permit2 DOMAIN_SEPARATOR captured |

### Captured Domain Separators (verified 2026-05-08)

```
USDC DOMAIN_SEPARATOR (Arc testnet):
0x361191522483d32a83e70ae7183b4b9629442c13a78bc9921d6f707911c8c6b0

Permit2 DOMAIN_SEPARATOR (Arc testnet):
0xe59c8d3fa907f1186bfa334839eb895f53f88b07e4cf5aafaef4af163d83ce93
```

### USDC EIP-712 Domain (verified)

```javascript
{
  name: "USDC",
  version: "2",
  chainId: 5042002,
  verifyingContract: "0x3600000000000000000000000000000000000000"
}
```

### Note on `totalSupply()` Revert

The USDC contract on Arc reverts on `totalSupply()` calls. This is non-blocking for x402 but unusual for standard ERC-20.

**Hypothesis:** Arc's USDC-as-gas implementation makes total supply dynamic/protocol-managed rather than tracked at the token contract level. Will not affect EIP-3009 settlement flow.

## 5. Architecture Decision: EIP-3009 Path

We will implement the x402 `exact` scheme via the **EIP-3009 path** (`transferWithAuthorization`), NOT the Permit2 path.

### Reasoning

| Criterion | EIP-3009 ✅ | Permit2 |
|---|---|---|
| Pre-approval needed | ❌ No | ✅ Yes (one-time) |
| Custom proxy contract | ❌ No | ✅ Yes (`x402ExactPermit2Proxy`) |
| Audit cost (v0.1) | $0 | $30k+ |
| Gas per settlement | Lower | Higher |
| Token universality | USDC-only | Any ERC-20 |
| Implementation time | Days | Weeks |

For an Arc-focused facilitator, USDC universality isn't a constraint — Arc IS USDC-native. EIP-3009 wins decisively for v0.1.

### Implication: No Custom Solidity Required

The facilitator calls `usdc.transferWithAuthorization(...)` directly. No proxy contract deployment needed. Entire v0.1 is a Node.js service + EIP-712 signing utilities.

## 6. x402 Specification Summary (EIP-3009 Path)

### Payment Payload Structure

```json
{
  "payload": {
    "signature": "0x<65-byte-secp256k1>",
    "authorization": {
      "from": "0x<buyer>",
      "to": "0x<seller>",
      "value": "10000",
      "validAfter": "1740672089",
      "validBefore": "1740672154",
      "nonce": "0x<bytes32>"
    }
  }
}
```

### EIP-712 TransferWithAuthorization Type

```javascript
const TRANSFER_WITH_AUTHORIZATION_TYPE = {
  TransferWithAuthorization: [
    { name: "from",         type: "address" },
    { name: "to",           type: "address" },
    { name: "value",        type: "uint256" },
    { name: "validAfter",   type: "uint256" },
    { name: "validBefore",  type: "uint256" },
    { name: "nonce",        type: "bytes32" }
  ]
};
```

### Facilitator Verification Steps

1. Verify signature recovers to `authorization.from`
2. Confirm `from` has sufficient USDC balance (`balanceOf`)
3. Validate `value`, `validAfter`, `validBefore` against PaymentRequirements
4. Confirm `network` and token address match expected (Arc + Arc-USDC)
5. (Optional) Simulate `transferWithAuthorization(...)` for revert check
6. Submit transaction; return tx hash

### Network Registration Path

Per [x402 docs](https://docs.x402.org/core-concepts/network-and-token-support):

> **Runtime Registration:** Any EVM network deployable via code — no source modification required. Register schemes dynamically using `eip155:*` patterns.

We will publish `@auranode/x402-arc` as a standalone package. PR upstream to `x402-foundation/x402` after testnet stabilizes.

## 7. Comparison: Existing Facilitators

| Implementation | Network | Stack | Notes |
|---|---|---|---|
| Coinbase CDP | Base, Solana | Internal | Production canonical |
| Stellar (OZ Relayer) | Stellar | Java/JS | March 2026 launch |
| second-state/x402-facilitator | EVM | Go | Open source reference |
| AceDataCloud | EVM | Node.js | Multi-purpose |
| Cronos | Cronos | Internal | Production |
| Sei | Sei | Internal | Production |
| **TalosFacilitator (us)** | **Arc** | **Node.js + Hono** | **WIP — first Arc impl** |

## 8. Aureus Protocol Architecture (v0.1 → v1)

```
v0.1 (4 weeks):
  TalosFacilitator
    └── x402 service for Arc testnet via EIP-3009

v0.2 (post-grant):
  + Tessera (constrained USDC primitive)
  + Acta (semantic action receipts)

v0.3:
  + Honos (reputation bonds)

v1.0 (mainnet):
  + Lit Protocol custody integration
  + Multi-chain (Base, Ink, Tempo via Gateway)
  + Audit complete
```

## 9. Next Steps (Week 2)

- [ ] Build facilitator service skeleton (TypeScript + Hono + Viem)
- [ ] Implement `/verify` endpoint with EIP-712 signature recovery
- [ ] Implement `/settle` endpoint that broadcasts `transferWithAuthorization`
- [ ] Implement `/supported` endpoint listing Arc + USDC
- [ ] Test against live Arc testnet with funded wallet (testnet USDC from `faucet.circle.com`)

## 10. Strategic Positioning

### Relationship to Circle's Roadmap

Per [GitHub Issue #447](https://github.com/coinbase/x402/issues/447), Circle plans to extend Gateway as an x402 facilitator with batched/cross-chain settlement. Status: planning, not yet shipped.

**Aureus positioning:** Arc-specific, single-chain, immediate-settlement community implementation. Complementary to Circle's planned Gateway facilitator (which will be multi-chain, batched, enterprise-focused).

When Circle Gateway facilitator ships, Aureus composes with it rather than competes.

### Target Users

1. **AI agent operators** building on Arc — need x402 to pay APIs
2. **API providers** wanting agent customers — need x402 to monetize
3. **Indonesian Web3 startups** — need stablecoin micropayment rails for SEA market
4. **Service marketplaces** — need facilitator infrastructure
5. **DAO treasuries** — agentic autonomous payments

## 11. References

- [x402 Specification (Foundation)](https://github.com/x402-foundation/x402)
- [x402 EVM Exact Scheme Spec](https://github.com/x402-foundation/x402/blob/main/specs/schemes/exact/scheme_exact_evm.md)
- [x402 Network & Token Support](https://docs.x402.org/core-concepts/network-and-token-support)
- [EIP-3009: Transfer With Authorization](https://eips.ethereum.org/EIPS/eip-3009)
- [Arc Network Docs](https://docs.arc.network)
- [Arc Contract Addresses](https://docs.arc.network/arc/references/contract-addresses)
- [Circle Developer Grants](https://www.circle.com/grant)
- [Circle Issue #447 — x402 x Gateway](https://github.com/coinbase/x402/issues/447)
- [Coinbase x402 (development fork)](https://github.com/coinbase/x402)

---

**Status:** Day 2 of 28-day v0.1 sprint. On track. ✅

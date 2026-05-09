# PR Plan — Adding Arc Network to `x402-foundation/x402`

> Roadmap for upstreaming Arc support so it becomes a "default network" in the
> reference x402 SDKs (TypeScript, Go, Python).

## Why upstream

- Currently x402 SDKs ship with default support for: abstract, base, avalanche, polygon, sei, story, iotex, peaq, educhain, skale-base-sepolia, etc.
- Arc is **NOT in that list yet**.
- Once merged, `@x402/evm` users get Arc out of the box — they can write `"$0.01"` pricing and it just works on Arc.
- Aureus becomes the canonical reference implementation for Arc x402 ecosystem.

## Pre-requisites (status check)

- ✅ Arc Testnet USDC supports EIP-3009 (verified Day 2)
- ✅ Permit2 deployed at canonical address on Arc Testnet
- ✅ Public facilitator running at https://aureus.auranode.xyz (proof of working impl)
- ✅ Multiple on-chain settlements confirmed via Arcscan
- ✅ MIT-licensed open source repo

This is exactly the proof maintainers want before accepting a new chain.

## Files to modify (per `DEFAULT_ASSETS.md` in upstream)

The exact paths require reading the upstream `DEFAULT_ASSETS.md` after forking. Based on existing chain entries, expected modifications:

### TypeScript SDK (`/typescript/packages/@x402/evm/`)

1. **Network registry** — add Arc Testnet entry:
   ```ts
   "arc-testnet": {
     name: "Arc Testnet",
     chainId: 5042002,
     caip2: "eip155:5042002",
     rpcUrl: "https://rpc.testnet.arc.network",
     blockExplorer: "https://testnet.arcscan.app",
     isTestnet: true,
   }
   ```

2. **Default assets registry** — add Arc USDC:
   ```ts
   "eip155:5042002": {
     USDC: {
       address: "0x3600000000000000000000000000000000000000",
       decimals: 6,
       eip712: { name: "USDC", version: "2" },
     },
     // EURC and USYC for completeness
   }
   ```

### Go SDK (`/go/...`)

Mirror the TypeScript registry entries in Go's chain config struct.

### Python SDK (`/python/...`)

Same data in Python format.

### Documentation

Update `DEFAULT_ASSETS.md` to list Arc in the supported chains table.

## PR Description Template

```markdown
# Add Arc Testnet (eip155:5042002) as a default network

## Summary

Adds support for Arc Testnet — Circle's stablecoin-native L1 — to the
default network/asset registries across the TypeScript, Go, and Python SDKs.

## Motivation

x402 currently supports Base, Avalanche, Polygon, Sei, Story, IoTeX, etc.,
but not Arc — even though Arc is the most natural fit for x402, given:

- USDC as native gas (no token volatility for AI agents to manage)
- Sub-second deterministic finality (Malachite BFT, no reorgs)
- EIP-3009 (`transferWithAuthorization`) supported by Arc USDC out of the box
- Permit2 deployed at the canonical address
- Mainnet beta planned for 2026 Q3-Q4 (Circle, Goldman, BlackRock partners)

This PR fills that gap so Arc Testnet is usable from `@x402/evm`,
`x402-go`, and `x402-py` with no additional configuration.

## Verification

The author runs the first community x402 facilitator for Arc, live at:

- https://aureus.auranode.xyz/health
- https://aureus.auranode.xyz/supported

End-to-end on-chain settlements verified on Arcscan:

- https://testnet.arcscan.app/tx/0x401ff57311fe103e7215a26490d6c8ee6cc91604688e450f2fccc7f12daf136f
- https://testnet.arcscan.app/tx/0x473d4278e5f15eec18bbe8dd3bc4057f8f4339af41fea67374c282e5e33838a8

EIP-3009 + Permit2 support on Arc Testnet was verified via Foundry probe tests
(see github.com/hidayahhtaufik/aureus/blob/master/test/USDCTest.t.sol).

## Files changed

- `typescript/packages/@x402/evm/...` — network + asset registry
- `go/...` — mirror entries
- `python/...` — mirror entries
- `DEFAULT_ASSETS.md` — documentation table

## Author context

Aureus Protocol — auranode.xyz — github.com/hidayahhtaufik/aureus.

Building Arc-specific developer-friendly facilitator + primitives layer
(Tessera/Honos/Acta) on top of the x402 standard.

Happy to iterate on naming, file placement, or any conventions per
maintainer preference.
```

## Steps

1. **Read upstream `CONTRIBUTING.md` + `DEFAULT_ASSETS.md`** to confirm exact file paths and format conventions.
2. **Fork** github.com/x402-foundation/x402 to github.com/hidayahhtaufik/x402.
3. **Branch** from `main`: `git checkout -b add-arc-testnet`.
4. **Edit** files per the lists above.
5. **Run upstream tests** to verify nothing else broke.
6. **Push** to fork.
7. **Open PR** with the description above.
8. **Open Discord ticket** in Arc Discord with link to PR + facilitator URL.
9. **Iterate** on maintainer feedback.

## Timing

- Open PR: Day 9 or 10 (now-ish)
- First review feedback: typically days to ~2 weeks
- Merge target: Q2 2026 (before Arc mainnet beta opens)

If maintainers ask for additional chains beyond testnet, we extend with `arc` (mainnet) once that chain ID is announced.

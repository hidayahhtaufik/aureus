# @hidayahhtaufik/x402-arc

> x402 protocol primitives for Arc Network — types, EIP-712 helpers, EIP-3009 signer, x402 client, and Express middleware.

Part of [Aureus Protocol](https://github.com/hidayahhtaufik/aureus). Used by:

- [`facilitator/`](../../facilitator) — TalosFacilitator service
- [`examples/seller`](../../examples/seller) — demo seller using `createX402Middleware`
- [`examples/buyer`](../../examples/buyer) — demo agent using `X402Client`

## Install

```bash
npm install @hidayahhtaufik/x402-arc
```

## Quickstart

### Network constants

```typescript
import {
  ARC_CAIP2,
  USDC_TOKEN,
  USDC_EIP712_DOMAIN,
  arcTestnet,
} from "@hidayahhtaufik/x402-arc";
```

### Buyer (agent paying x402 endpoints)

```typescript
import { privateKeyToAccount } from "viem/accounts";
import { X402Client } from "@hidayahhtaufik/x402-arc/client";

const account = privateKeyToAccount(process.env.BUYER_PRIVATE_KEY as `0x${string}`);
const client = new X402Client(account);

const { data, settlement } = await client.payAndFetch("https://example.com/api/weather");
console.log("Got data:", data);
console.log("Tx hash:", settlement?.transaction);
```

### Seller (Express middleware that gates a route)

```typescript
import express from "express";
import { createX402Middleware } from "@hidayahhtaufik/x402-arc/server";

const app = express();

const x402 = createX402Middleware({
  facilitatorUrl: "https://x402.arc.auranode.xyz",
  payTo: "0xYourSellerAddress",
  priceUsdc: "0.01",
  description: "Live weather data — paid",
});

app.get("/api/weather", x402, (_req, res) => {
  res.json({ city: "Jakarta", temp_c: 28 });
});
```

### Low-level signing

```typescript
import { signEip3009Authorization } from "@hidayahhtaufik/x402-arc/client";
import { randomNonce } from "@hidayahhtaufik/x402-arc";

const signed = await signEip3009Authorization(account, {
  from: account.address,
  to: "0xRecipient",
  value: 10_000n,           // 0.01 USDC (6 decimals)
  validAfter: 0n,
  validBefore: 9_999_999_999n,
  nonce: randomNonce(),
});
```

## Architecture

This package is **path-agnostic** — it does not assume any particular HTTP framework on the buyer side, and the Express middleware is the only framework-coupled module (Express is a peer dependency).

- **`@hidayahhtaufik/x402-arc`** — constants, types, EIP-712, EIP-3009 (no I/O)
- **`@hidayahhtaufik/x402-arc/client`** — buyer signer + x402 fetch client
- **`@hidayahhtaufik/x402-arc/server`** — facilitator HTTP client + Express middleware

## Compatibility

- Node ≥ 20
- viem ≥ 2.21
- Optional: express ≥ 4.21 (only if you use the middleware)

## License

MIT

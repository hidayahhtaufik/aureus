# Aureus Demo Seller

Express server exposing one paid endpoint protected by [TalosFacilitator](../../facilitator) (Aureus' x402 implementation for Arc Network).

## Routes

| Method | Path | Cost | Description |
|---|---|---|---|
| GET | `/` | Free | Server info |
| GET | `/health` | Free | Health check |
| GET | `/api/weather` | `PRICE_USDC` per call | Paid Jakarta weather data |

## Quickstart

```bash
cd examples/seller
npm install
cp .env.example .env
# Edit .env and set SELLER_ADDRESS to a real 0x-prefixed address
npm run dev
```

Defaults: `PORT=8403`, `FACILITATOR_URL=http://localhost:8402`, `PRICE_USDC=0.01`.

## How it works

- Hits to `/api/weather` without `X-PAYMENT` header receive HTTP 402 + a `paymentRequirements` JSON body.
- Buyer signs an EIP-3009 `TransferWithAuthorization` for Arc USDC.
- Buyer base64-encodes `{ signature, authorization }`, sends `X-PAYMENT: <base64>`.
- Middleware forwards the payload to the facilitator's `/verify` and `/settle` endpoints.
- On success, the seller serves the weather JSON and returns the on-chain tx hash in `X-PAYMENT-RESPONSE`.

See [`../buyer`](../buyer) for the matching agent that consumes this endpoint.

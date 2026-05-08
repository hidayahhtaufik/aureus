# Aureus Demo Buyer (Agent)

Standalone Node.js agent that auto-pays x402-protected endpoints on Arc Testnet.

## Quickstart

```bash
cd examples/buyer
npm install
cp .env.example .env
# Edit .env, set BUYER_PRIVATE_KEY (testnet wallet with USDC)
npm run buy
```

## How it works

1. GET `SELLER_URL` without a payment header → seller returns 402 with `paymentRequirements`.
2. Agent signs an EIP-3009 `TransferWithAuthorization` for Arc USDC.
3. Agent base64-encodes the payment payload, retries with `X-PAYMENT: <base64>`.
4. Seller forwards to facilitator `/verify` and `/settle`.
5. Facilitator settles on-chain (`transferWithAuthorization` on Arc USDC).
6. Seller serves the protected content + `X-PAYMENT-RESPONSE` (settlement details).

## Environment

| Variable | Default | Required |
|---|---|---|
| `BUYER_PRIVATE_KEY` | — | yes |
| `SELLER_URL` | `http://localhost:8403/api/weather` | no |

## Note on shared logic

`src/eip3009-signer.ts` and `src/x402-client.ts` are written to be self-contained — no imports from the facilitator package. They will be lifted into the published `@auranode/x402-arc` npm package later.

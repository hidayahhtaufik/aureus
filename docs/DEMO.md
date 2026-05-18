# Aureus — Live Demo & Tweet Guide

Run the full x402 loop against the public facilitator in 3 minutes and post a
verifiable on-chain proof. This guide is for **content / Twitter** — for the
runbook to deploy your own facilitator, see [`/deploy/DEPLOYMENT.md`](../deploy/DEPLOYMENT.md).

---

## Prerequisites

- **Node ≥ 20** + **npm**
- A **fresh Arc Testnet wallet** with a small USDC balance.
  Claim USDC from the Circle faucet: <https://faucet.circle.com> (select Arc Testnet, paste your wallet address).
- A second wallet address to receive payment (can be a burn address for demo).

---

## 30-second smoke test (no signing yet)

Hit the public facilitator directly to prove it's alive:

```bash
curl -i  https://aureus.auranode.xyz/
curl -s  https://aureus.auranode.xyz/health | jq
curl -s  https://aureus.auranode.xyz/supported | jq
```

You should see:

- `GET /` → JSON service info
- `GET /health` → `{"ok":true,"timestamp":<unix-ms>}`
- `GET /supported` → `{ "kinds": [{ "scheme": "exact", "network": "eip155:5042002", "extra": { … } }] }`

That confirms the facilitator + Nginx + cert + Arc RPC are all healthy.

📸 **Screenshot 1 for the thread**: terminal output of the three curls.

---

## 2-minute end-to-end: HTTP 402 → sign → settle on Arc

Clone the repo locally (you can skip if you already have it):

```bash
git clone https://github.com/hidayahhtaufik/aureus.git
cd aureus
npm install
```

### Step 1 — start the seller (local Express server, port 8403)

```bash
cd examples/seller
cp .env.example .env
# Edit .env, set:
#   SELLER_ADDRESS=0x<your-payout-wallet>
#   FACILITATOR_URL=https://aureus.auranode.xyz
#   PRICE_USDC=0.01
npm run dev
```

In another terminal, try without payment:

```bash
curl -i http://localhost:8403/api/weather
```

You should see:

```
HTTP/1.1 402 Payment Required
content-type: application/json

{
  "x402Version": 1,
  "paymentRequirements": [{
    "scheme": "exact",
    "network": "eip155:5042002",
    "maxAmountRequired": "10000",
    "asset": "0x3600000000000000000000000000000000000000",
    "payTo": "0x<your-seller-address>",
    ...
  }],
  "error": "Payment required"
}
```

📸 **Screenshot 2**: the 402 + payment requirements.

### Step 2 — run the buyer agent (signs + retries with payment)

```bash
cd examples/buyer
cp .env.example .env
# Edit .env, set:
#   BUYER_PRIVATE_KEY=0x<wallet with Arc Testnet USDC>
#   SELLER_URL=http://localhost:8403/api/weather
npm run buy
```

Expected output:

```
[buyer] GET /api/weather → 402
[buyer] Required: 0.01 USDC on eip155:5042002 → 0x<seller>
[buyer] Signing EIP-3009 transferWithAuthorization...
[buyer] Retrying with X-PAYMENT...
[buyer] ✓ 200 OK
[buyer]   payment tx: 0xabc…def
[buyer]   arcscan:    https://testnet.arcscan.app/tx/0xabc…def
[buyer]   weather:    { city: "Jakarta", temp: 31, humidity: 78, ... }
```

📸 **Screenshot 3**: the buyer log showing 402 → sign → 200 → tx hash.

### Step 3 — verify on Arc Testnet explorer

Open the `arcscan` URL in your browser. You'll see the actual
`transferWithAuthorization` call: buyer → seller, value 10000 (= 0.01
USDC × 10^6), settled sub-second.

📸 **Screenshot 4**: Arcscan transaction page with the tx confirmed.

---

## Twitter thread template

Here's a thread you can post once you have the four screenshots. Replace
`{TX_HASH}` and `{ARCSCAN_URL}` with your real values.

---

> **🜚 Aureus Protocol** — the first community x402 facilitator for Arc Network is live.
>
> x402 (HTTP 402 Payment Required) was on Base, Solana, Algorand, Stellar.
> **Not Arc.**
>
> Today it is. 1/6

📸 *attach Screenshot 1 — facilitator health + /supported response*

---

> What's x402?
>
> Every API call carries a signed micropayment in its headers. Server returns 402, client signs, retries, settles on-chain. No API keys, no monthly bills, just per-request USDC.
>
> Why Arc? USDC is the gas. Sub-second finality. ~$0.002 per tx. 2/6

---

> The loop:
> • GET protected endpoint → seller returns **HTTP 402** + payment requirements
> • Buyer signs an **EIP-3009 transferWithAuthorization**
> • Retries with `X-PAYMENT: base64(payload)`
> • Facilitator verifies + broadcasts on Arc
> • Seller serves the content + returns the tx hash
>
> One round-trip. 3/6

📸 *attach Screenshot 2 — the 402 + paymentRequirements JSON*

---

> Just ran the full loop:
>
> • paid 0.01 USDC to my own seller endpoint
> • facilitator settled on Arc Testnet in <1 second
> • tx: {TX_HASH}
> • {ARCSCAN_URL}
>
> Total cost (payment + gas): ~$0.0119. 4/6

📸 *attach Screenshot 3 — the buyer log*

---

> Everything is open source:
>
> • Facilitator service (Hono + Viem + Zod, 36 vitest tests)
> • Buyer + seller examples
> • Production runbook (Docker + Nginx + Let's Encrypt)
>
> Public facilitator: aureus.auranode.xyz
> Repo: github.com/hidayahhtaufik/aureus 5/6

📸 *attach Screenshot 4 — Arcscan tx detail*

---

> Next:
>
> • `@auranode/x402-arc` SDK on npm
> • Upstream PR to x402-foundation/x402 adding Arc as a first-class network
> • v0.2 primitives: Tessera (USDC spending policies) · Honos (rep bond) · Acta (action receipts)
>
> If you build agent commerce on Arc, this is the rail. 6/6

---

## Optional flourishes

### Loom / OBS video (60-90 seconds)

Record once with the same 3 terminals + the Arcscan tab. Cut to: facilitator
boot → 402 response → buyer signs → tx on Arcscan. Tag @circle, @arc_network,
@x402_foundation.

### Comparison table for your tweet thread reply

| Chain | Stablecoin gas | x402 facilitator | Sub-sec finality |
|---|---|---|---|
| Base | no (ETH) | ✅ (Coinbase) | no (~2s) |
| Solana | no (SOL) | ✅ | ✅ |
| Algorand | no (ALGO) | ✅ | ✅ |
| Stellar | no (XLM) | ✅ | ✅ |
| **Arc** | **✅ USDC** | **🜚 Aureus (this repo)** | **✅** |

### Hashtags

`#x402 #ArcNetwork #Circle #USDC #AgentCommerce #OpenSource`

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `curl /supported` returns connection refused | facilitator not running, or Nginx is down | `sudo docker ps`; `sudo systemctl status nginx` |
| Buyer gets 400 on retry | EIP-712 domain mismatch (wrong chainId or USDC version) | Confirm `ARC_CHAIN_ID=5042002` + USDC version `"2"` in `@auranode/x402-arc` constants |
| Settle hangs | Facilitator wallet has 0 USDC balance | Top up at <https://faucet.circle.com> |
| Buyer gets 402 again after retry | Verifier rejected the signature | Check `buyer` logs — usually nonce reused or `validBefore` in the past |

If something else breaks, open an issue with the facilitator's log output:
`sudo docker logs aureus-facilitator | tail -100`.

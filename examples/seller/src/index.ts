/**
 * Demo seller — small Express server with one paid endpoint.
 *
 * Endpoints:
 *   GET  /                — server info (free)
 *   GET  /health          — health check (free)
 *   GET  /api/weather     — paid endpoint, costs PRICE_USDC USDC per request
 */

import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";

import { createX402Middleware } from "@hidayahhtaufik/x402-arc/server";

const PORT = Number(process.env.PORT ?? 8403);
const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "http://localhost:8402";
const SELLER_ADDRESS = (process.env.SELLER_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;
const PRICE_USDC = process.env.PRICE_USDC ?? "0.01";

if (
  SELLER_ADDRESS === "0x0000000000000000000000000000000000000000" ||
  !/^0x[a-fA-F0-9]{40}$/.test(SELLER_ADDRESS)
) {
  console.error(
    "❌ SELLER_ADDRESS env var is required (a 0x-prefixed 20-byte address)."
  );
  console.error("   Edit examples/seller/.env and try again.");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "256kb" }));

app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Aureus Demo Seller",
    description: "Paid weather API gated by x402 on Arc Testnet",
    facilitator: FACILITATOR_URL,
    seller: SELLER_ADDRESS,
    price: `${PRICE_USDC} USDC`,
    routes: {
      "GET /": "this info",
      "GET /health": "health check",
      "GET /api/weather": `paid — ${PRICE_USDC} USDC via x402`,
    },
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, timestamp: Date.now() });
});

// Paid route — protected by Aureus x402 middleware (from @hidayahhtaufik/x402-arc/server)
const x402 = createX402Middleware({
  facilitatorUrl: FACILITATOR_URL,
  payTo: SELLER_ADDRESS,
  priceUsdc: PRICE_USDC,
  description: "Live weather data for Jakarta — paid x402 demo",
  maxTimeoutSeconds: 60,
});

app.get("/api/weather", x402, (_req: Request, res: Response) => {
  res.json({
    city: "Jakarta",
    timestamp: new Date().toISOString(),
    temp_c: 26 + Math.round(Math.random() * 6),
    humidity_pct: 70 + Math.round(Math.random() * 20),
    condition: ["Cerah", "Berawan", "Hujan ringan", "Hujan lebat"][
      Math.floor(Math.random() * 4)
    ],
    wind_kph: Math.round(5 + Math.random() * 15),
    paid_for_with: "Aureus / TalosFacilitator x402 on Arc Testnet",
  });
});

app.listen(PORT, () => {
  console.log(`🛒 Aureus Demo Seller running on http://localhost:${PORT}`);
  console.log(`   Free: GET / , GET /health`);
  console.log(`   Paid: GET /api/weather (${PRICE_USDC} USDC via x402)`);
  console.log(`   Facilitator: ${FACILITATOR_URL}`);
  console.log(`   Receiving payments to: ${SELLER_ADDRESS}`);
});

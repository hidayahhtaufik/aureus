/**
 * Demo agent — calls a paid x402 endpoint and auto-pays the 402 challenge.
 */

import "dotenv/config";
import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { X402Client } from "@auranode/x402-arc/client";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    console.error(`\n❌ Missing required env: ${name}\n`);
    process.exit(1);
  }
  return v;
}

const BUYER_PRIVATE_KEY = requireEnv("BUYER_PRIVATE_KEY") as Hex;
const SELLER_URL = process.env.SELLER_URL ?? "http://localhost:8403/api/weather";

const account = privateKeyToAccount(BUYER_PRIVATE_KEY);

function divider(label: string): void {
  console.log(`\n${"━".repeat(8)} ${label} ${"━".repeat(60 - label.length)}`);
}

async function main(): Promise<void> {
  console.log("🤖 Aureus Demo Buyer Agent");
  console.log(`   Buyer:      ${account.address}`);
  console.log(`   Seller URL: ${SELLER_URL}`);

  const client = new X402Client(account);

  divider("REQUESTING PAID RESOURCE");
  console.log("   → GET (no payment) — expecting 402 challenge…");

  const result = await client.payAndFetch<Record<string, unknown>>(SELLER_URL);

  if (result.settlement) {
    divider("SETTLEMENT");
    console.log(`   success:  ${result.settlement.success}`);
    if (result.settlement.transaction) {
      console.log(`   tx hash:  ${result.settlement.transaction}`);
      console.log(
        `   Arcscan:  https://testnet.arcscan.app/tx/${result.settlement.transaction}`
      );
    }
    if (result.settlement.payer) {
      console.log(`   payer:    ${result.settlement.payer}`);
    }
    if (result.settlement.network) {
      console.log(`   network:  ${result.settlement.network}`);
    }
    if (result.settlement.errorReason) {
      console.log(`   error:    ${result.settlement.errorReason}`);
    }
  }

  divider("CONTENT RECEIVED");
  console.log(JSON.stringify(result.data, null, 2));

  console.log("\n✅ Auto-payment complete.\n");
}

main().catch((err) => {
  console.error("\n💥 Buyer agent failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

/**
 * Day 7 — End-to-End test driver.
 *
 * Behavior:
 *   1. Reads BUYER_PRIVATE_KEY (signs the EIP-3009 authorization)
 *      and RECIPIENT_ADDRESS (the seller / who receives the USDC).
 *   2. Queries the buyer's USDC balance on Arc testnet.
 *   3. Builds and signs an EIP-712 TransferWithAuthorization message
 *      using the same domain the verifier expects.
 *   4. POSTs the x402 payment payload to:
 *        - /verify   (read-only signature + balance + nonce check)
 *        - /settle   (broadcasts transferWithAuthorization on-chain)
 *   5. Prints the tx hash + Arcscan link if settle succeeds.
 *
 * Run:
 *   npm run dev         # in one terminal
 *   npm run send        # in another terminal
 *
 * Required env (in facilitator/.env):
 *   BUYER_PRIVATE_KEY        — 0x-prefixed 32-byte hex (testnet wallet with USDC)
 *   FACILITATOR_PRIVATE_KEY  — same or different wallet; pays gas to broadcast
 *   RECIPIENT_ADDRESS        — 0x-prefixed; can equal buyer for self-transfer test
 *
 * Optional env:
 *   FACILITATOR_URL  (default http://localhost:8402)
 *   VALUE_USDC       (default "0.01" — i.e., 0.01 USDC)
 */

import "dotenv/config";
import { createPublicClient, http, getAddress, keccak256, toHex } from "viem";
import type { Address, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import {
  arcTestnet,
  USDC_EIP712_DOMAIN,
  USDC_TOKEN,
  ARC_CAIP2,
} from "../src/config/arc.js";
import { TRANSFER_WITH_AUTHORIZATION_TYPES } from "../src/lib/eip712.js";
import { USDC_ABI } from "../src/lib/usdc-abi.js";

// ---- Env parsing ----

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    console.error(`\n❌ Missing required env: ${name}`);
    console.error(`   Set it in facilitator/.env and try again.\n`);
    process.exit(1);
  }
  return v;
}

const BUYER_PRIVATE_KEY = requireEnv("BUYER_PRIVATE_KEY") as Hex;
const RECIPIENT_ADDRESS = requireEnv("RECIPIENT_ADDRESS") as Hex;
const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "http://localhost:8402";
const VALUE_USDC_STR = process.env.VALUE_USDC ?? "0.01";

// ---- Wallet + client setup ----

const buyer = privateKeyToAccount(BUYER_PRIVATE_KEY);
const recipient = getAddress(RECIPIENT_ADDRESS);

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

// ---- Helpers ----

function usdcToAtomic(decimalString: string): bigint {
  // Parse a decimal USDC string (e.g., "0.01") into atomic units (6 decimals).
  if (!/^\d+(\.\d{1,6})?$/.test(decimalString)) {
    throw new Error(
      `Invalid USDC amount "${decimalString}". Use up to 6 decimal places.`
    );
  }
  const [whole = "0", fractional = ""] = decimalString.split(".");
  const padded = (fractional + "000000").slice(0, 6);
  return BigInt(whole) * 1_000_000n + BigInt(padded);
}

function atomicToUsdc(atomic: bigint): string {
  const whole = atomic / 1_000_000n;
  const frac = (atomic % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}

function randomNonce(): Hex {
  // Cryptographically random bytes32; collision-resistant.
  return keccak256(
    toHex(`aureus-day7-${Date.now()}-${Math.random()}-${Math.random()}`)
  );
}

function arcscanUrl(txHash: string): string {
  return `https://testnet.arcscan.app/tx/${txHash}`;
}

function divider(label: string): void {
  console.log(`\n${"━".repeat(8)} ${label} ${"━".repeat(60 - label.length)}`);
}

// ---- Main ----

async function main(): Promise<void> {
  console.log("🛡️  Aureus Day 7 — End-to-End x402 Settlement Test");
  console.log(`   Buyer:     ${buyer.address}`);
  console.log(`   Recipient: ${recipient}`);
  console.log(`   Value:     ${VALUE_USDC_STR} USDC`);
  console.log(`   Facilitator: ${FACILITATOR_URL}`);

  // --- Pre-flight: check buyer balance ---
  divider("PRE-FLIGHT");
  const valueAtomic = usdcToAtomic(VALUE_USDC_STR);
  console.log(`   Atomic units: ${valueAtomic}`);

  const balance = (await publicClient.readContract({
    address: USDC_TOKEN.address as Address,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [buyer.address],
  })) as bigint;
  console.log(`   Buyer USDC balance: ${atomicToUsdc(balance)} USDC`);

  if (balance < valueAtomic) {
    console.error(
      `\n❌ Insufficient USDC. Need ${VALUE_USDC_STR}, have ${atomicToUsdc(balance)}.`
    );
    console.error("   Claim testnet USDC at https://faucet.circle.com\n");
    process.exit(1);
  }

  // --- Build authorization ---
  divider("BUILD + SIGN AUTHORIZATION");
  const now = Math.floor(Date.now() / 1000);
  const validAfter = BigInt(now - 60); // 1 minute back
  const validBefore = BigInt(now + 600); // 10 minutes forward
  const nonce = randomNonce();

  const authorization = {
    from: buyer.address,
    to: recipient,
    value: valueAtomic.toString(),
    validAfter: validAfter.toString(),
    validBefore: validBefore.toString(),
    nonce,
  };
  console.log("   Authorization:", authorization);

  const signature = await buyer.signTypedData({
    domain: USDC_EIP712_DOMAIN,
    types: TRANSFER_WITH_AUTHORIZATION_TYPES,
    primaryType: "TransferWithAuthorization",
    message: {
      from: buyer.address,
      to: recipient,
      value: valueAtomic,
      validAfter,
      validBefore,
      nonce,
    },
  });
  console.log(`   Signature: ${signature.slice(0, 22)}...${signature.slice(-20)}`);

  // --- Build x402 request body ---
  const body = {
    x402Version: 1,
    paymentPayload: {
      x402Version: 1,
      scheme: "exact" as const,
      network: ARC_CAIP2,
      payload: {
        signature,
        authorization,
      },
    },
    paymentRequirements: {
      scheme: "exact" as const,
      network: ARC_CAIP2,
      maxAmountRequired: valueAtomic.toString(),
      resource: "https://aureus.test/day-7-end-to-end",
      description: "Aureus Day 7 end-to-end test",
      payTo: recipient,
      maxTimeoutSeconds: 60,
      asset: USDC_TOKEN.address,
    },
  };

  // --- Step A: /verify ---
  divider("POST /verify");
  const verifyRes = await fetch(`${FACILITATOR_URL}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const verifyJson = (await verifyRes.json()) as Record<string, unknown>;
  console.log(`   HTTP ${verifyRes.status}`);
  console.log("   Response:", JSON.stringify(verifyJson, null, 2));

  if (!verifyJson.isValid) {
    console.error(
      `\n❌ /verify rejected the payload: ${verifyJson.invalidReason ?? "unknown reason"}`
    );
    console.error("   Aborting — not calling /settle.\n");
    process.exit(1);
  }

  // --- Step B: /settle ---
  divider("POST /settle");
  console.log("   Broadcasting transferWithAuthorization on Arc testnet...");
  const settleRes = await fetch(`${FACILITATOR_URL}/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const settleJson = (await settleRes.json()) as Record<string, unknown>;
  console.log(`   HTTP ${settleRes.status}`);
  console.log("   Response:", JSON.stringify(settleJson, null, 2));

  if (!settleJson.success) {
    console.error(
      `\n❌ /settle failed: ${settleJson.errorReason ?? "unknown reason"}\n`
    );
    process.exit(1);
  }

  // --- Verify on-chain side effects ---
  divider("ON-CHAIN VERIFICATION");
  const txHash = settleJson.transaction as Hex;
  console.log(`   Tx hash: ${txHash}`);
  console.log(`   Arcscan: ${arcscanUrl(txHash)}`);

  const newBalance = (await publicClient.readContract({
    address: USDC_TOKEN.address as Address,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [buyer.address],
  })) as bigint;
  console.log(`   Buyer balance after: ${atomicToUsdc(newBalance)} USDC`);
  console.log(`   Buyer balance delta: -${atomicToUsdc(balance - newBalance)} USDC`);

  console.log("\n✅ END-TO-END SUCCESS — Day 7 milestone hit.");
  console.log(`   Open ${arcscanUrl(txHash)} to inspect the on-chain tx.\n`);
}

main().catch((err) => {
  console.error("\n💥 Unexpected error:", err);
  process.exit(1);
});

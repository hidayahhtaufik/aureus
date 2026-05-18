/**
 * x402 payment verification logic for the EIP-3009 path on Arc.
 *
 * Pure verification (no on-chain writes). Used by both /verify and /settle
 * endpoints.
 */

import { getAddress } from "viem";
import type { Address, Hex } from "viem";

import {
  ARC_CAIP2,
  USDC_TOKEN,
  recoverEip3009Signer,
  signerMatchesAuthorizer,
  type Eip3009Authorization,
  type PaymentRequirements,
  type X402PaymentPayloadEnvelope,
} from "@hidayahhtaufik/x402-arc";

import { publicClient } from "./arc-client.js";
import { USDC_ABI } from "./usdc-abi.js";

// Re-export the envelope type under the historical name so existing route /
// test imports keep working.
export type X402PaymentPayload = X402PaymentPayloadEnvelope;

export type VerifyOk = {
  ok: true;
  payer: Address;
  recoveredSigner: Address;
};

export type VerifyFail = {
  ok: false;
  invalidReason: string;
  payer?: Address;
};

export type VerifyResult = VerifyOk | VerifyFail;

/**
 * Run all verification checks against an x402 payment payload.
 *
 * Steps (fast-fail on first failure):
 *   1. Outer scheme matches "exact"
 *   2. Outer network matches Arc testnet
 *   3. Requirements scheme/network match
 *   4. Requirements asset address matches Arc USDC
 *   5. Recipient (authorization.to) matches requirements.payTo
 *   6. Authorized value covers maxAmountRequired
 *   7. Authorization time window is currently active
 *   8. EIP-712 signature recovers to authorization.from
 *   9. authorization.from has sufficient USDC balance
 *  10. Authorization nonce has not been used
 */
export async function verifyPayment(
  outerPayload: X402PaymentPayloadEnvelope,
  requirements: PaymentRequirements
): Promise<VerifyResult> {
  const auth = outerPayload.payload.authorization;
  const sig = outerPayload.payload.signature as Hex;

  // 1. Outer scheme
  if (outerPayload.scheme !== "exact") {
    return fail(`Unsupported scheme: ${outerPayload.scheme} (only "exact" is supported)`, auth);
  }

  // 2. Outer network
  if (outerPayload.network !== ARC_CAIP2) {
    return fail(
      `Unsupported network: ${outerPayload.network} (only ${ARC_CAIP2} is supported)`,
      auth
    );
  }

  // 3. Requirements scheme/network must align
  if (requirements.scheme !== "exact") {
    return fail(`Requirements scheme must be "exact", got ${requirements.scheme}`, auth);
  }
  if (requirements.network !== ARC_CAIP2) {
    return fail(`Requirements network must be ${ARC_CAIP2}, got ${requirements.network}`, auth);
  }

  // 4. Asset address must be Arc USDC
  if (!addressesEqual(requirements.asset, USDC_TOKEN.address)) {
    return fail(
      `Asset must be Arc USDC (${USDC_TOKEN.address}), got ${requirements.asset}`,
      auth
    );
  }

  // 5. Recipient must match requirements.payTo
  if (!addressesEqual(auth.to, requirements.payTo)) {
    return fail(
      `Recipient mismatch: authorization.to=${auth.to} != requirements.payTo=${requirements.payTo}`,
      auth
    );
  }

  // 6. Authorized value covers required amount
  let authValue: bigint;
  let requiredAmount: bigint;
  try {
    authValue = BigInt(auth.value);
    requiredAmount = BigInt(requirements.maxAmountRequired);
  } catch {
    return fail("Invalid bigint in value or maxAmountRequired", auth);
  }
  if (authValue < requiredAmount) {
    return fail(`Authorized value ${authValue} below required ${requiredAmount}`, auth);
  }

  // 7. Time validity window
  const now = BigInt(Math.floor(Date.now() / 1000));
  let validAfter: bigint;
  let validBefore: bigint;
  try {
    validAfter = BigInt(auth.validAfter);
    validBefore = BigInt(auth.validBefore);
  } catch {
    return fail("Invalid bigint in validAfter or validBefore", auth);
  }
  if (now < validAfter) {
    return fail(`Authorization not yet valid (validAfter=${validAfter}, now=${now})`, auth);
  }
  if (now >= validBefore) {
    return fail(`Authorization expired (validBefore=${validBefore}, now=${now})`, auth);
  }

  // 8. Signature recovery (cryptographic check)
  const recoveryResult = await recoverEip3009Signer(auth, sig);
  if (!recoveryResult.ok) {
    return fail(recoveryResult.error, auth);
  }
  const recoveredSigner = recoveryResult.signer;
  if (!signerMatchesAuthorizer(recoveredSigner, auth.from)) {
    return fail(
      `Signature recovered to ${recoveredSigner} but authorization.from=${auth.from}`,
      auth
    );
  }

  // 9. Balance check (on-chain read)
  let balance: bigint;
  try {
    balance = await publicClient.readContract({
      address: USDC_TOKEN.address as Address,
      abi: USDC_ABI,
      functionName: "balanceOf",
      args: [getAddress(auth.from)],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail(`Balance lookup failed: ${msg}`, auth);
  }
  if (balance < authValue) {
    return fail(`Insufficient balance: payer has ${balance}, needs ${authValue}`, auth);
  }

  // 10. Nonce reuse check (on-chain read)
  let nonceUsed: boolean;
  try {
    nonceUsed = await publicClient.readContract({
      address: USDC_TOKEN.address as Address,
      abi: USDC_ABI,
      functionName: "authorizationState",
      args: [getAddress(auth.from), auth.nonce as Hex],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail(`Nonce lookup failed: ${msg}`, auth);
  }
  if (nonceUsed) {
    return fail(`Authorization nonce already used: ${auth.nonce}`, auth);
  }

  return {
    ok: true,
    payer: getAddress(auth.from),
    recoveredSigner,
  };
}

// ---- helpers ----

function fail(invalidReason: string, auth: Eip3009Authorization): VerifyFail {
  let payer: Address | undefined;
  try {
    payer = getAddress(auth.from);
  } catch {
    payer = undefined;
  }
  return payer ? { ok: false, invalidReason, payer } : { ok: false, invalidReason };
}

function addressesEqual(a: string, b: string): boolean {
  try {
    return getAddress(a) === getAddress(b);
  } catch {
    return false;
  }
}

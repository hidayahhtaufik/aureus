/**
 * x402 settlement logic — broadcasts `transferWithAuthorization` on Arc.
 *
 * Flow:
 *   1. Run verifyPayment (re-runs the full check chain).
 *   2. Decode the signature into v/r/s.
 *   3. Pre-flight simulate, then submit transferWithAuthorization.
 *   4. Wait for the receipt; report success or revert reason.
 */

import { getAddress } from "viem";
import type { Address } from "viem";

import {
  USDC_TOKEN,
  decodeSignature,
  type PaymentRequirements,
  type X402PaymentPayloadEnvelope,
} from "@hidayahhtaufik/x402-arc";

import { publicClient, getWalletClient } from "./arc-client.js";
import { verifyPayment } from "./verifier.js";
import { USDC_ABI } from "./usdc-abi.js";

export type SettleOk = {
  ok: true;
  transactionHash: `0x${string}`;
  payer: Address;
  network: string;
};

export type SettleFail = {
  ok: false;
  errorReason: string;
  transactionHash?: `0x${string}`;
  payer?: Address;
  network: string;
};

export type SettleResult = SettleOk | SettleFail;

export async function settlePayment(
  outerPayload: X402PaymentPayloadEnvelope,
  requirements: PaymentRequirements
): Promise<SettleResult> {
  const network = outerPayload.network;

  // 1. Verify
  const verifyResult = await verifyPayment(outerPayload, requirements);
  if (!verifyResult.ok) {
    return {
      ok: false,
      errorReason: `Verification failed: ${verifyResult.invalidReason}`,
      network,
      ...(verifyResult.payer ? { payer: verifyResult.payer } : {}),
    };
  }

  // 2. Get wallet
  const wallet = getWalletClient();
  if (!wallet) {
    return {
      ok: false,
      errorReason:
        "Facilitator wallet not configured. Set FACILITATOR_PRIVATE_KEY in .env (must hold testnet USDC for gas).",
      payer: verifyResult.payer,
      network,
    };
  }

  // 3. Decode signature
  const auth = outerPayload.payload.authorization;
  let v: number;
  let r: `0x${string}`;
  let s: `0x${string}`;
  try {
    const decoded = decodeSignature(outerPayload.payload.signature as `0x${string}`);
    v = decoded.v;
    r = decoded.r;
    s = decoded.s;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      errorReason: `Signature decode failed: ${msg}`,
      payer: verifyResult.payer,
      network,
    };
  }

  // 4. Pre-flight simulation
  try {
    await publicClient.simulateContract({
      account: wallet.account,
      address: USDC_TOKEN.address as Address,
      abi: USDC_ABI,
      functionName: "transferWithAuthorization",
      args: [
        getAddress(auth.from),
        getAddress(auth.to),
        BigInt(auth.value),
        BigInt(auth.validAfter),
        BigInt(auth.validBefore),
        auth.nonce as `0x${string}`,
        v,
        r,
        s,
      ],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      errorReason: `Pre-flight simulation failed: ${msg}`,
      payer: verifyResult.payer,
      network,
    };
  }

  // 5. Broadcast
  let txHash: `0x${string}`;
  try {
    txHash = await wallet.writeContract({
      address: USDC_TOKEN.address as Address,
      abi: USDC_ABI,
      functionName: "transferWithAuthorization",
      args: [
        getAddress(auth.from),
        getAddress(auth.to),
        BigInt(auth.value),
        BigInt(auth.validAfter),
        BigInt(auth.validBefore),
        auth.nonce as `0x${string}`,
        v,
        r,
        s,
      ],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      errorReason: `Broadcast failed: ${msg}`,
      payer: verifyResult.payer,
      network,
    };
  }

  // 6. Wait for receipt
  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
      timeout: 30_000,
    });

    if (receipt.status !== "success") {
      return {
        ok: false,
        errorReason: `Transaction reverted on-chain (status=${receipt.status})`,
        transactionHash: txHash,
        payer: verifyResult.payer,
        network,
      };
    }

    return {
      ok: true,
      transactionHash: txHash,
      payer: verifyResult.payer,
      network,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      errorReason: `Receipt wait failed: ${msg}`,
      transactionHash: txHash,
      payer: verifyResult.payer,
      network,
    };
  }
}

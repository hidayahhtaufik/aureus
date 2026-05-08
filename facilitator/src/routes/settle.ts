import { Hono } from "hono";

import { VerifyRequestSchema } from "../types/x402.js";
import type { SettleResponse } from "../types/x402.js";
import { settlePayment } from "../lib/settler.js";
import type { X402PaymentPayload } from "../lib/verifier.js";
import { ARC_CAIP2 } from "../config/arc.js";

export const settleRoute = new Hono();

/**
 * POST /settle
 *
 * Validates AND settles an x402 payment payload on Arc by submitting
 * `transferWithAuthorization` from the facilitator wallet.
 *
 * Returns success only when the on-chain transaction is mined and its
 * receipt status is "success".
 */
settleRoute.post("/", async (c) => {
  // Parse + validate body shape
  const raw = await c.req.json().catch(() => null);
  const parsed = VerifyRequestSchema.safeParse(raw);

  if (!parsed.success) {
    const response: SettleResponse = {
      success: false,
      errorReason: `Malformed request body: ${parsed.error.message}`,
      network: ARC_CAIP2,
    };
    return c.json(response, 400);
  }

  const { paymentPayload, paymentRequirements } = parsed.data;

  const outerPayload: X402PaymentPayload = {
    x402Version: paymentPayload.x402Version,
    scheme: paymentPayload.scheme,
    network: paymentPayload.network,
    payload: paymentPayload.payload,
  };

  const result = await settlePayment(outerPayload, paymentRequirements);

  if (result.ok) {
    const response: SettleResponse = {
      success: true,
      transaction: result.transactionHash,
      network: result.network,
      payer: result.payer,
    };
    return c.json(response, 200);
  }

  const response: SettleResponse = {
    success: false,
    errorReason: result.errorReason,
    network: result.network,
    ...(result.transactionHash ? { transaction: result.transactionHash } : {}),
    ...(result.payer ? { payer: result.payer } : {}),
  };
  return c.json(response, 200);
});

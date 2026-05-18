import { Hono } from "hono";

import {
  ARC_CAIP2,
  VerifyRequestSchema,
  type SettleResponse,
} from "@hidayahhtaufik/x402-arc";

import { settlePayment } from "../lib/settler.js";
import type { X402PaymentPayload } from "../lib/verifier.js";

export const settleRoute = new Hono();

/**
 * POST /settle
 *
 * Validates AND settles an x402 payment payload on Arc by submitting
 * `transferWithAuthorization` from the facilitator wallet.
 */
settleRoute.post("/", async (c) => {
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

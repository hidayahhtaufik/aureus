import { Hono } from "hono";

import {
  VerifyRequestSchema,
  type VerifyResponse,
} from "@auranode/x402-arc";

import { verifyPayment, type X402PaymentPayload } from "../lib/verifier.js";

export const verifyRoute = new Hono();

/**
 * POST /verify
 *
 * Validates an x402 payment payload off-chain (signature recovery, balance,
 * nonce, time, amount checks). No on-chain broadcast.
 */
verifyRoute.post("/", async (c) => {
  const raw = await c.req.json().catch(() => null);
  const parsed = VerifyRequestSchema.safeParse(raw);

  if (!parsed.success) {
    const response: VerifyResponse = {
      isValid: false,
      invalidReason: `Malformed request body: ${parsed.error.message}`,
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

  const result = await verifyPayment(outerPayload, paymentRequirements);

  if (result.ok) {
    const response: VerifyResponse = {
      isValid: true,
      payer: result.payer,
    };
    return c.json(response, 200);
  }

  const response: VerifyResponse = result.payer
    ? { isValid: false, invalidReason: result.invalidReason, payer: result.payer }
    : { isValid: false, invalidReason: result.invalidReason };
  return c.json(response, 200);
});

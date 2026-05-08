import { Hono } from "hono";

import { VerifyRequestSchema } from "../types/x402.js";
import type { VerifyResponse } from "../types/x402.js";
import { verifyPayment } from "../lib/verifier.js";
import type { X402PaymentPayload } from "../lib/verifier.js";

export const verifyRoute = new Hono();

/**
 * POST /verify
 *
 * Validates an x402 payment payload off-chain (signature recovery, balance
 * lookup, nonce check, time window, etc.) WITHOUT broadcasting a transaction.
 *
 * Per x402 spec, sellers SHOULD NOT fully trust /verify alone — only /settle
 * proves on-chain settlement. /verify is a fast pre-check to reject obviously
 * invalid payloads before requesting settlement.
 */
verifyRoute.post("/", async (c) => {
  // Parse + validate body shape
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

  // Cast to internal verifier type. Schema already guarantees shape.
  const outerPayload: X402PaymentPayload = {
    x402Version: paymentPayload.x402Version,
    scheme: paymentPayload.scheme,
    network: paymentPayload.network,
    payload: paymentPayload.payload,
  };

  // Run all verification checks
  const result = await verifyPayment(outerPayload, paymentRequirements);

  if (result.ok) {
    const response: VerifyResponse = {
      isValid: true,
      payer: result.payer,
    };
    return c.json(response, 200);
  }

  // result.ok === false
  const response: VerifyResponse = result.payer
    ? { isValid: false, invalidReason: result.invalidReason, payer: result.payer }
    : { isValid: false, invalidReason: result.invalidReason };
  return c.json(response, 200);
});

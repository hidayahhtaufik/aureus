/**
 * Express middleware that protects routes with x402 payments on Arc.
 *
 * Flow:
 *   1. Buyer hits a protected route without `X-PAYMENT` header.
 *   2. Middleware returns HTTP 402 with `paymentRequirements` JSON.
 *   3. Buyer signs an EIP-3009 authorization, base64-encodes the payment
 *      payload, and retries with `X-PAYMENT: <base64>`.
 *   4. Middleware decodes the header, calls the facilitator's `/verify` and
 *      `/settle` endpoints, and on success serves the protected content with
 *      `X-PAYMENT-RESPONSE` describing the settlement (tx hash, etc.).
 */

import type { NextFunction, Request, Response } from "express";

import { ARC_CAIP2, USDC_TOKEN } from "../constants.js";
import { FacilitatorClient } from "./facilitator-client.js";

export type X402MiddlewareOptions = {
  /** URL of the running facilitator. */
  facilitatorUrl: string;
  /** Address that should receive USDC. */
  payTo: `0x${string}`;
  /** Price per request as a decimal USDC string (e.g. "0.01"). */
  priceUsdc: string;
  /** Optional human-readable description sent in the 402 body. */
  description?: string;
  /** Max time the buyer has to settle, in seconds. Defaults to 60. */
  maxTimeoutSeconds?: number;
};

function usdcDecimalToAtomic(decimalString: string): string {
  if (!/^\d+(\.\d{1,6})?$/.test(decimalString)) {
    throw new Error(
      `Invalid USDC price "${decimalString}" — must be a decimal with up to 6 places.`
    );
  }
  const [whole = "0", fractional = ""] = decimalString.split(".");
  const padded = (fractional + "000000").slice(0, 6);
  return (BigInt(whole) * 1_000_000n + BigInt(padded)).toString();
}

function buildPaymentRequirements(
  opts: X402MiddlewareOptions,
  resourceUrl: string
): Record<string, unknown> {
  return {
    scheme: "exact",
    network: ARC_CAIP2,
    maxAmountRequired: usdcDecimalToAtomic(opts.priceUsdc),
    resource: resourceUrl,
    description: opts.description ?? "x402-protected resource",
    payTo: opts.payTo,
    maxTimeoutSeconds: opts.maxTimeoutSeconds ?? 60,
    asset: USDC_TOKEN.address,
  };
}

function decodeXPaymentHeader(headerValue: string): unknown {
  try {
    const json = Buffer.from(headerValue, "base64").toString("utf8");
    return JSON.parse(json);
  } catch (err) {
    throw new Error(
      `Invalid X-PAYMENT header: not valid base64-encoded JSON (${
        err instanceof Error ? err.message : String(err)
      })`
    );
  }
}

/**
 * Build an Express middleware that gates the next handler behind an x402
 * payment. On success, the protected handler runs as normal and the response
 * carries an `X-PAYMENT-RESPONSE` header with the on-chain settlement details.
 */
export function createX402Middleware(opts: X402MiddlewareOptions) {
  const facilitator = new FacilitatorClient(opts.facilitatorUrl);

  return async function x402(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const resourceUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const paymentRequirements = buildPaymentRequirements(opts, resourceUrl);

    const xPayment = req.header("X-PAYMENT");

    if (!xPayment) {
      res.status(402).json({
        x402Version: 1,
        accepts: [paymentRequirements],
        error: "X-PAYMENT header required",
      });
      return;
    }

    let paymentPayload: unknown;
    try {
      paymentPayload = decodeXPaymentHeader(xPayment);
    } catch (err) {
      res
        .status(400)
        .json({ error: err instanceof Error ? err.message : String(err) });
      return;
    }

    const verifyBody = {
      x402Version: 1,
      paymentPayload,
      paymentRequirements,
    };

    const verifyResult = await facilitator.verify(verifyBody);
    if (!verifyResult.isValid) {
      res.status(402).json({
        x402Version: 1,
        accepts: [paymentRequirements],
        error: `Payment invalid: ${verifyResult.invalidReason}`,
      });
      return;
    }

    const settleResult = await facilitator.settle(verifyBody);
    if (!settleResult.success) {
      res.status(402).json({
        x402Version: 1,
        accepts: [paymentRequirements],
        error: `Settlement failed: ${settleResult.errorReason}`,
      });
      return;
    }

    const xPaymentResponse = Buffer.from(
      JSON.stringify({
        success: true,
        transaction: settleResult.transaction,
        network: settleResult.network,
        payer: settleResult.payer,
      }),
      "utf8"
    ).toString("base64");

    res.setHeader("X-PAYMENT-RESPONSE", xPaymentResponse);
    next();
  };
}

/**
 * x402 protocol types for the EIP-3009 path on EVM chains.
 *
 * Reference spec:
 *   https://github.com/x402-foundation/x402/blob/main/specs/schemes/exact/scheme_exact_evm.md
 */

import { z } from "zod";

// ---- Primitives ----

const HexAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid 0x-prefixed address");
const HexBytes32 = z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid 0x-prefixed bytes32");
const HexSignature = z.string().regex(
  /^0x[a-fA-F0-9]{130}$/,
  "Invalid 0x-prefixed 65-byte signature"
);
const NumericString = z.string().regex(/^\d+$/, "Must be a numeric string (no decimal/sign)");

// ---- EIP-3009 authorization ----

export const Eip3009AuthorizationSchema = z.object({
  from: HexAddress,
  to: HexAddress,
  value: NumericString,
  validAfter: NumericString,
  validBefore: NumericString,
  nonce: HexBytes32,
});

export type Eip3009Authorization = z.infer<typeof Eip3009AuthorizationSchema>;

// ---- x402 payment payload (EIP-3009 path) ----

export const PaymentPayloadSchema = z.object({
  signature: HexSignature,
  authorization: Eip3009AuthorizationSchema,
});

export type PaymentPayload = z.infer<typeof PaymentPayloadSchema>;

// ---- x402 PaymentRequirements (what the seller demands) ----

export const PaymentRequirementsSchema = z.object({
  scheme: z.literal("exact"),
  network: z.string(),
  maxAmountRequired: NumericString,
  resource: z.string(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
  outputSchema: z.unknown().optional(),
  payTo: HexAddress,
  maxTimeoutSeconds: z.number().int().positive(),
  asset: HexAddress,
  extra: z.unknown().optional(),
});

export type PaymentRequirements = z.infer<typeof PaymentRequirementsSchema>;

// ---- /verify and /settle request body ----

const X402PaymentPayloadEnvelopeSchema = z.object({
  x402Version: z.number().int().positive(),
  scheme: z.literal("exact"),
  network: z.string(),
  payload: PaymentPayloadSchema,
});

export const VerifyRequestSchema = z.object({
  x402Version: z.number().int().positive(),
  paymentPayload: X402PaymentPayloadEnvelopeSchema,
  paymentRequirements: PaymentRequirementsSchema,
});

export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;

// ---- /verify response ----

export type VerifyResponse =
  | { isValid: true; payer: string }
  | { isValid: false; invalidReason: string; payer?: string };

// ---- /settle response ----

export type SettleResponse =
  | {
      success: true;
      transaction: string;
      network: string;
      payer: string;
    }
  | {
      success: false;
      errorReason: string;
      transaction?: string;
      network: string;
      payer?: string;
    };

// ---- /supported response ----

export type SupportedKind = {
  x402Version: number;
  scheme: "exact";
  network: string;
  extra?: {
    name: string;
    asset: {
      address: string;
      decimals: number;
      symbol: string;
      eip712: {
        name: string;
        version: string;
      };
    };
  };
};

export type SupportedResponse = {
  kinds: SupportedKind[];
};

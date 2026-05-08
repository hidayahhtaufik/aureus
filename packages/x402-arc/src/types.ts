/**
 * x402 protocol types for the EIP-3009 path on EVM chains.
 *
 * Reference spec:
 *   https://github.com/x402-foundation/x402/blob/main/specs/schemes/exact/scheme_exact_evm.md
 *
 * All schemas are Zod-based for runtime validation at API boundaries.
 * The inferred TypeScript types are exported for compile-time use.
 */

import { z } from "zod";

// ---- Primitive validators ----

export const HexAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid 0x-prefixed address");

export const HexBytes32Schema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid 0x-prefixed bytes32");

export const HexSignatureSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{130}$/, "Invalid 0x-prefixed 65-byte signature");

export const NumericStringSchema = z
  .string()
  .regex(/^\d+$/, "Must be a numeric string (no decimal/sign)");

// ---- EIP-3009 authorization ----

export const Eip3009AuthorizationSchema = z.object({
  from: HexAddressSchema,
  to: HexAddressSchema,
  value: NumericStringSchema,
  validAfter: NumericStringSchema,
  validBefore: NumericStringSchema,
  nonce: HexBytes32Schema,
});

export type Eip3009Authorization = z.infer<typeof Eip3009AuthorizationSchema>;

// ---- x402 payment payload (EIP-3009 path) ----

export const PaymentPayloadSchema = z.object({
  signature: HexSignatureSchema,
  authorization: Eip3009AuthorizationSchema,
});

export type PaymentPayload = z.infer<typeof PaymentPayloadSchema>;

// ---- x402 PaymentRequirements ----

export const PaymentRequirementsSchema = z.object({
  scheme: z.literal("exact"),
  network: z.string(),
  maxAmountRequired: NumericStringSchema,
  resource: z.string(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
  outputSchema: z.unknown().optional(),
  payTo: HexAddressSchema,
  maxTimeoutSeconds: z.number().int().positive(),
  asset: HexAddressSchema,
  extra: z.unknown().optional(),
});

export type PaymentRequirements = z.infer<typeof PaymentRequirementsSchema>;

// ---- /verify and /settle request envelope ----

export const X402PaymentPayloadEnvelopeSchema = z.object({
  x402Version: z.number().int().positive(),
  scheme: z.literal("exact"),
  network: z.string(),
  payload: PaymentPayloadSchema,
});

export type X402PaymentPayloadEnvelope = z.infer<
  typeof X402PaymentPayloadEnvelopeSchema
>;

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

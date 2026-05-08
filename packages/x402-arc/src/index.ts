/**
 * @auranode/x402-arc — x402 protocol primitives for Arc Network.
 *
 * Main entry — re-exports network constants, types, and EIP-712 / EIP-3009
 * helpers. Buyer- and seller-side helpers live under subpath exports:
 *
 *   import { X402Client } from "@auranode/x402-arc/client";
 *   import { createX402Middleware } from "@auranode/x402-arc/server";
 */

// Constants
export {
  ARC_CHAIN_ID,
  ARC_CAIP2,
  ARC_TESTNET_RPC,
  ARC_TESTNET_RPC_WS,
  ARC_TESTNET_EXPLORER,
  ARC_TESTNET_FAUCET,
  ARC_TESTNET_ADDRESSES,
  USDC_TOKEN,
  USDC_EIP712_DOMAIN,
  arcTestnet,
} from "./constants.js";

// Types + Zod schemas
export {
  HexAddressSchema,
  HexBytes32Schema,
  HexSignatureSchema,
  NumericStringSchema,
  Eip3009AuthorizationSchema,
  PaymentPayloadSchema,
  PaymentRequirementsSchema,
  X402PaymentPayloadEnvelopeSchema,
  VerifyRequestSchema,
} from "./types.js";

export type {
  Eip3009Authorization,
  PaymentPayload,
  PaymentRequirements,
  X402PaymentPayloadEnvelope,
  VerifyRequest,
  VerifyResponse,
  SettleResponse,
  SupportedKind,
  SupportedResponse,
} from "./types.js";

// EIP-712 + EIP-3009 helpers (used by both buyer and verifier sides)
export {
  TRANSFER_WITH_AUTHORIZATION_TYPES,
  recoverEip3009Signer,
  signerMatchesAuthorizer,
  type SignerRecoveryResult,
} from "./eip712.js";

export {
  decodeSignature,
  randomNonce,
  type DecodedSignature,
} from "./eip3009.js";

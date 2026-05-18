/**
 * EIP-712 typed-data construction and signature recovery for x402 EIP-3009.
 *
 * The TYPES below MUST exactly match Circle's USDC v2 contract type definitions
 * — any deviation produces signatures the contract will reject on-chain.
 */

import { recoverTypedDataAddress, getAddress } from "viem";
import type { Address, Hex } from "viem";

import { USDC_EIP712_DOMAIN } from "./constants.js";
import type { Eip3009Authorization } from "./types.js";

/**
 * Canonical EIP-712 type definition for `TransferWithAuthorization`.
 */
export const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export type SignerRecoveryResult =
  | { ok: true; signer: Address }
  | { ok: false; error: string };

/**
 * Recover the EOA that signed the EIP-712 TransferWithAuthorization message.
 *
 * Returns:
 *   { ok: true, signer } if signature is valid and recovers cleanly
 *   { ok: false, error } if signature is malformed or recovery fails
 *
 * Note: this only confirms WHO signed; caller must compare against
 * `authorization.from` to confirm the signer is the authorizer.
 */
export async function recoverEip3009Signer(
  authorization: Eip3009Authorization,
  signature: Hex
): Promise<SignerRecoveryResult> {
  if (signature.length !== 132) {
    return {
      ok: false,
      error: `Invalid signature length: expected 132 chars, got ${signature.length}`,
    };
  }

  try {
    const signer = await recoverTypedDataAddress({
      domain: USDC_EIP712_DOMAIN,
      types: TRANSFER_WITH_AUTHORIZATION_TYPES,
      primaryType: "TransferWithAuthorization",
      message: {
        from: getAddress(authorization.from),
        to: getAddress(authorization.to),
        value: BigInt(authorization.value),
        validAfter: BigInt(authorization.validAfter),
        validBefore: BigInt(authorization.validBefore),
        nonce: authorization.nonce as Hex,
      },
      signature,
    });

    return { ok: true, signer };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Signature recovery failed: ${message}` };
  }
}

/**
 * Check if a recovered signer matches the claimed authorizer.
 * Uses checksummed-address comparison (case-insensitive on hex digits).
 */
export function signerMatchesAuthorizer(
  recoveredSigner: Address,
  claimedFrom: string
): boolean {
  try {
    return getAddress(recoveredSigner) === getAddress(claimedFrom);
  } catch {
    return false;
  }
}

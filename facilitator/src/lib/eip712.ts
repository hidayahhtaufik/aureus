/**
 * EIP-712 typed-data construction and signature recovery for x402 EIP-3009 path.
 */

import { recoverTypedDataAddress, getAddress } from "viem";
import type { Address, Hex } from "viem";
import { USDC_EIP712_DOMAIN } from "../config/arc.js";
import type { Eip3009Authorization } from "../types/x402.js";

/**
 * EIP-712 type definition for `TransferWithAuthorization`.
 * MUST exactly match Circle's USDC v2 contract types or signatures will fail.
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
): Promise<{ ok: true; signer: Address } | { ok: false; error: string }> {
  // Validate signature length (65 bytes = 130 hex chars + 0x prefix = 132)
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

/**
 * Buyer-side EIP-3009 signer.
 *
 * Wraps a viem `LocalAccount` to produce signed `TransferWithAuthorization`
 * payloads ready to be embedded in x402 payment headers.
 */

import type { Address, Hex, LocalAccount } from "viem";

import { USDC_EIP712_DOMAIN } from "../constants.js";
import { TRANSFER_WITH_AUTHORIZATION_TYPES } from "../eip712.js";

export type Eip3009AuthorizationInput = {
  from: Address;
  to: Address;
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: Hex;
};

export type SignedEip3009Authorization = {
  signature: Hex;
  authorization: {
    from: Address;
    to: Address;
    value: string;
    validAfter: string;
    validBefore: string;
    nonce: Hex;
  };
};

/**
 * Sign an EIP-3009 authorization against the Arc USDC EIP-712 domain.
 *
 * Returns a payload shape compatible with the x402 `exact` scheme.
 */
export async function signEip3009Authorization(
  account: LocalAccount,
  auth: Eip3009AuthorizationInput
): Promise<SignedEip3009Authorization> {
  const signature = await account.signTypedData({
    domain: USDC_EIP712_DOMAIN,
    types: TRANSFER_WITH_AUTHORIZATION_TYPES,
    primaryType: "TransferWithAuthorization",
    message: {
      from: auth.from,
      to: auth.to,
      value: auth.value,
      validAfter: auth.validAfter,
      validBefore: auth.validBefore,
      nonce: auth.nonce,
    },
  });

  return {
    signature,
    authorization: {
      from: auth.from,
      to: auth.to,
      value: auth.value.toString(),
      validAfter: auth.validAfter.toString(),
      validBefore: auth.validBefore.toString(),
      nonce: auth.nonce,
    },
  };
}

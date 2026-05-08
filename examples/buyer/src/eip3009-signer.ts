/**
 * Signs EIP-3009 `TransferWithAuthorization` messages against the Arc USDC
 * EIP-712 domain, exactly matching what the facilitator's verifier expects.
 *
 * This module is self-contained — it does not import from the facilitator
 * package, so it can later be lifted into a standalone npm package.
 */

import { keccak256, toHex } from "viem";
import type { Address, Hex, LocalAccount } from "viem";

// ---- Arc Testnet constants (verified Day 2) ----

export const ARC_USDC = "0x3600000000000000000000000000000000000000" as const;
export const ARC_CHAIN_ID = 5042002;
export const USDC_DOMAIN = {
  name: "USDC",
  version: "2",
  chainId: ARC_CHAIN_ID,
  verifyingContract: ARC_USDC,
} as const;

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

export type Eip3009Authorization = {
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

export function randomNonce(seed?: string): Hex {
  const data = seed
    ? `${seed}-${Date.now()}-${Math.random()}`
    : `aureus-buyer-${Date.now()}-${Math.random()}-${Math.random()}`;
  return keccak256(toHex(data));
}

/**
 * Sign an EIP-3009 authorization. Returns a payload ready to be wrapped
 * by the x402 client and sent in the `X-PAYMENT` header.
 */
export async function signEip3009Authorization(
  account: LocalAccount,
  auth: Eip3009Authorization
): Promise<SignedEip3009Authorization> {
  const signature = await account.signTypedData({
    domain: USDC_DOMAIN,
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

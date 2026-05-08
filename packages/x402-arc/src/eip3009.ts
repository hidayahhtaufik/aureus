/**
 * EIP-3009 helpers — signature decode + nonce generation.
 *
 * USDC v2's `transferWithAuthorization` takes signature as separate v, r, s
 * parameters (not a single bytes blob). This module decomposes the 65-byte
 * compact signature accordingly.
 */

import { keccak256, toHex } from "viem";
import type { Hex } from "viem";

export type DecodedSignature = {
  r: Hex;
  s: Hex;
  v: number;
};

/**
 * Decode a 65-byte secp256k1 signature into v, r, s parts.
 *
 * Layout (65 bytes total, 130 hex chars + "0x" prefix = 132 chars):
 *   bytes [0:32]   → r
 *   bytes [32:64]  → s
 *   bytes [64]     → v
 *
 * Throws on invalid length. Normalizes v to {27, 28} per EIP-155 convention.
 */
export function decodeSignature(signature: Hex): DecodedSignature {
  if (typeof signature !== "string" || !signature.startsWith("0x")) {
    throw new Error("Signature must be a 0x-prefixed hex string");
  }
  if (signature.length !== 132) {
    throw new Error(
      `Invalid signature length: expected 132 chars (65 bytes + 0x), got ${signature.length}`
    );
  }

  const r = `0x${signature.slice(2, 66)}` as Hex;
  const s = `0x${signature.slice(66, 130)}` as Hex;
  let v = parseInt(signature.slice(130, 132), 16);

  if (Number.isNaN(v)) {
    throw new Error("Could not parse v byte from signature");
  }

  if (v < 27) v += 27;

  if (v !== 27 && v !== 28) {
    throw new Error(`Invalid v value after normalization: ${v}`);
  }

  return { r, s, v };
}

/**
 * Generate a cryptographically random bytes32 nonce for EIP-3009 authorizations.
 *
 * @param seed Optional string mixed into the entropy for deterministic test fixtures.
 */
export function randomNonce(seed?: string): Hex {
  const data = seed
    ? `${seed}-${Date.now()}-${Math.random()}`
    : `x402-arc-${Date.now()}-${Math.random()}-${Math.random()}`;
  return keccak256(toHex(data));
}

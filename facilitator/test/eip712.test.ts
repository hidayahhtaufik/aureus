import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

import {
  recoverEip3009Signer,
  signerMatchesAuthorizer,
  TRANSFER_WITH_AUTHORIZATION_TYPES,
  USDC_EIP712_DOMAIN,
  type Eip3009Authorization,
} from "@auranode/x402-arc";

// Anvil's well-known dev private key #0 — public, NEVER use for real funds.
const TEST_PRIVATE_KEY: Hex =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const TEST_ACCOUNT = privateKeyToAccount(TEST_PRIVATE_KEY);

const SAMPLE_AUTH: Eip3009Authorization = {
  from: TEST_ACCOUNT.address,
  to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  value: "1000000",
  validAfter: "0",
  validBefore: "9999999999",
  nonce: `0x${"11".repeat(32)}`,
};

async function signAuth(auth: Eip3009Authorization): Promise<Hex> {
  return TEST_ACCOUNT.signTypedData({
    domain: USDC_EIP712_DOMAIN,
    types: TRANSFER_WITH_AUTHORIZATION_TYPES,
    primaryType: "TransferWithAuthorization",
    message: {
      from: auth.from as `0x${string}`,
      to: auth.to as `0x${string}`,
      value: BigInt(auth.value),
      validAfter: BigInt(auth.validAfter),
      validBefore: BigInt(auth.validBefore),
      nonce: auth.nonce as `0x${string}`,
    },
  });
}

describe("recoverEip3009Signer", () => {
  it("round-trip: a properly signed authorization recovers to the signer", async () => {
    const sig = await signAuth(SAMPLE_AUTH);
    const result = await recoverEip3009Signer(SAMPLE_AUTH, sig);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.signer.toLowerCase()).toBe(TEST_ACCOUNT.address.toLowerCase());
    }
  });

  it("rejects a signature with the wrong byte length", async () => {
    const tooShort = `0x${"00".repeat(64)}` as Hex;
    const result = await recoverEip3009Signer(SAMPLE_AUTH, tooShort);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Invalid signature length/);
    }
  });

  it("recovers a different address when the message has been tampered with", async () => {
    const sig = await signAuth(SAMPLE_AUTH);

    const tamperedAuth: Eip3009Authorization = { ...SAMPLE_AUTH, value: "9999999" };
    const result = await recoverEip3009Signer(tamperedAuth, sig);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.signer.toLowerCase()).not.toBe(
        TEST_ACCOUNT.address.toLowerCase()
      );
    }
  });

  it("returns an error for an all-zero signature (invalid r=0)", async () => {
    const allZero = `0x${"00".repeat(65)}` as Hex;
    const result = await recoverEip3009Signer(SAMPLE_AUTH, allZero);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Signature recovery failed/i);
    }
  });
});

describe("signerMatchesAuthorizer", () => {
  it("returns true for the same address (different cases)", () => {
    const lower = TEST_ACCOUNT.address.toLowerCase();
    expect(signerMatchesAuthorizer(TEST_ACCOUNT.address, lower)).toBe(true);
  });

  it("returns false for different addresses", () => {
    const other = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    expect(signerMatchesAuthorizer(TEST_ACCOUNT.address, other)).toBe(false);
  });

  it("returns false for malformed addresses", () => {
    expect(signerMatchesAuthorizer(TEST_ACCOUNT.address, "not-an-address")).toBe(false);
  });
});

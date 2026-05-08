import { beforeEach, describe, expect, it, vi } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

// Mock arc-client BEFORE importing modules that consume it.
vi.mock("../src/lib/arc-client.js", () => ({
  publicClient: {
    readContract: vi.fn(),
  },
  getWalletClient: () => null,
}));

import { publicClient } from "../src/lib/arc-client.js";
import { verifyPayment, type X402PaymentPayload } from "../src/lib/verifier.js";
import {
  TRANSFER_WITH_AUTHORIZATION_TYPES,
  USDC_EIP712_DOMAIN,
  USDC_TOKEN,
  ARC_CAIP2,
  type Eip3009Authorization,
  type PaymentRequirements,
} from "@auranode/x402-arc";

// Anvil dev key #0 — public, never for real funds.
const TEST_PRIVATE_KEY: Hex =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const TEST_ACCOUNT = privateKeyToAccount(TEST_PRIVATE_KEY);

const SELLER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;

function freshAuth(overrides: Partial<Eip3009Authorization> = {}): Eip3009Authorization {
  const now = Math.floor(Date.now() / 1000);
  return {
    from: TEST_ACCOUNT.address,
    to: SELLER,
    value: "1000000",
    validAfter: String(now - 60),
    validBefore: String(now + 600),
    nonce: `0x${"aa".repeat(32)}`,
    ...overrides,
  };
}

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

function freshRequirements(
  overrides: Partial<PaymentRequirements> = {}
): PaymentRequirements {
  return {
    scheme: "exact",
    network: ARC_CAIP2,
    maxAmountRequired: "1000000",
    resource: "https://example.com/api/data",
    payTo: SELLER,
    maxTimeoutSeconds: 60,
    asset: USDC_TOKEN.address,
    ...overrides,
  };
}

async function buildPayload(
  auth: Eip3009Authorization,
  outerOverrides: Partial<X402PaymentPayload> = {}
): Promise<X402PaymentPayload> {
  const sig = await signAuth(auth);
  return {
    x402Version: 1,
    scheme: "exact",
    network: ARC_CAIP2,
    payload: { signature: sig, authorization: auth },
    ...outerOverrides,
  };
}

const mockedReadContract = vi.mocked(publicClient.readContract);

beforeEach(() => {
  mockedReadContract.mockReset();
});

describe("verifyPayment — happy path", () => {
  it("approves a fully valid payment", async () => {
    const auth = freshAuth();
    const payload = await buildPayload(auth);
    const requirements = freshRequirements();

    mockedReadContract.mockResolvedValueOnce(10_000_000n);
    mockedReadContract.mockResolvedValueOnce(false);

    const result = await verifyPayment(payload, requirements);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payer.toLowerCase()).toBe(TEST_ACCOUNT.address.toLowerCase());
    }
    expect(mockedReadContract).toHaveBeenCalledTimes(2);
  });
});

describe("verifyPayment — rejection paths", () => {
  it("rejects unsupported outer scheme", async () => {
    const auth = freshAuth();
    const payload = await buildPayload(auth, { scheme: "exact" });
    (payload as { scheme: string }).scheme = "permit2";
    const result = await verifyPayment(payload, freshRequirements());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.invalidReason).toMatch(/Unsupported scheme/);
  });

  it("rejects unsupported outer network", async () => {
    const auth = freshAuth();
    const payload = await buildPayload(auth, { network: "eip155:1" });
    const result = await verifyPayment(payload, freshRequirements());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.invalidReason).toMatch(/Unsupported network/);
  });

  it("rejects mismatched requirements network", async () => {
    const auth = freshAuth();
    const payload = await buildPayload(auth);
    const result = await verifyPayment(
      payload,
      freshRequirements({ network: "eip155:8453" })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.invalidReason).toMatch(/Requirements network/);
  });

  it("rejects mismatched asset address", async () => {
    const auth = freshAuth();
    const payload = await buildPayload(auth);
    const result = await verifyPayment(
      payload,
      freshRequirements({ asset: "0x0000000000000000000000000000000000000001" })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.invalidReason).toMatch(/Asset must be Arc USDC/);
  });

  it("rejects mismatched recipient (auth.to !== payTo)", async () => {
    const auth = freshAuth({ to: "0x0000000000000000000000000000000000000002" });
    const payload = await buildPayload(auth);
    const result = await verifyPayment(payload, freshRequirements());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.invalidReason).toMatch(/Recipient mismatch/);
  });

  it("rejects authorized value below required", async () => {
    const auth = freshAuth({ value: "100" });
    const payload = await buildPayload(auth);
    const result = await verifyPayment(payload, freshRequirements());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.invalidReason).toMatch(/below required/);
  });

  it("rejects an authorization not yet valid (future validAfter)", async () => {
    const future = String(Math.floor(Date.now() / 1000) + 3600);
    const auth = freshAuth({ validAfter: future });
    const payload = await buildPayload(auth);
    const result = await verifyPayment(payload, freshRequirements());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.invalidReason).toMatch(/not yet valid/);
  });

  it("rejects an expired authorization (past validBefore)", async () => {
    const past = String(Math.floor(Date.now() / 1000) - 60);
    const auth = freshAuth({ validBefore: past });
    const payload = await buildPayload(auth);
    const result = await verifyPayment(payload, freshRequirements());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.invalidReason).toMatch(/expired/);
  });

  it("rejects a tampered message (signature recovers to wrong address)", async () => {
    const auth = freshAuth();
    const payload = await buildPayload(auth);
    payload.payload.authorization = { ...auth, value: "9999999" };

    const result = await verifyPayment(payload, freshRequirements());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.invalidReason).toMatch(
        /Signature recovered to .* but authorization\.from/
      );
    }
  });

  it("rejects when the payer's balance is insufficient", async () => {
    const auth = freshAuth();
    const payload = await buildPayload(auth);

    mockedReadContract.mockResolvedValueOnce(0n);

    const result = await verifyPayment(payload, freshRequirements());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.invalidReason).toMatch(/Insufficient balance/);
  });

  it("rejects when the authorization nonce has already been used", async () => {
    const auth = freshAuth();
    const payload = await buildPayload(auth);

    mockedReadContract.mockResolvedValueOnce(10_000_000n);
    mockedReadContract.mockResolvedValueOnce(true);

    const result = await verifyPayment(payload, freshRequirements());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.invalidReason).toMatch(/nonce already used/);
  });
});

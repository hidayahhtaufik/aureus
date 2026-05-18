import { describe, expect, it, vi } from "vitest";

// Mock arc-client so route handlers don't actually hit Arc RPC.
vi.mock("../src/lib/arc-client.js", () => ({
  publicClient: {
    readContract: vi.fn(),
  },
  getWalletClient: () => null,
}));

import { app } from "../src/app.js";
import { publicClient } from "../src/lib/arc-client.js";
import { ARC_CAIP2, USDC_TOKEN } from "@hidayahhtaufik/x402-arc";

const mockedReadContract = vi.mocked(publicClient.readContract);

describe("GET /", () => {
  it("returns project info", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { name: string; version: string };
    expect(body.name).toBe("TalosFacilitator");
    expect(body.version).toBe("0.1.0");
  });
});

describe("GET /health", () => {
  it("returns ok with timestamp", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; timestamp: number };
    expect(body.ok).toBe(true);
    expect(typeof body.timestamp).toBe("number");
  });
});

describe("GET /supported", () => {
  it("returns Arc Testnet + USDC kind", async () => {
    const res = await app.request("/supported");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      kinds: Array<{ scheme: string; network: string; extra?: { asset: { address: string } } }>;
    };
    expect(body.kinds).toHaveLength(1);
    expect(body.kinds[0]?.scheme).toBe("exact");
    expect(body.kinds[0]?.network).toBe(ARC_CAIP2);
    expect(body.kinds[0]?.extra?.asset.address).toBe(USDC_TOKEN.address);
  });
});

describe("POST /verify — body validation", () => {
  it("returns 400 on malformed JSON", async () => {
    const res = await app.request("/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 on missing required fields", async () => {
    const res = await app.request("/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x402Version: 1 }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { isValid: boolean; invalidReason: string };
    expect(body.isValid).toBe(false);
    expect(body.invalidReason).toMatch(/Malformed request body/);
  });

  it("returns 400 on bad signature length", async () => {
    const res = await app.request("/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        x402Version: 1,
        paymentPayload: {
          x402Version: 1,
          scheme: "exact",
          network: ARC_CAIP2,
          payload: {
            signature: "0x1234",
            authorization: {
              from: "0x1111111111111111111111111111111111111111",
              to: "0x2222222222222222222222222222222222222222",
              value: "100",
              validAfter: "0",
              validBefore: "9999999999",
              nonce: `0x${"00".repeat(32)}`,
            },
          },
        },
        paymentRequirements: {
          scheme: "exact",
          network: ARC_CAIP2,
          maxAmountRequired: "100",
          resource: "https://test.com",
          payTo: "0x2222222222222222222222222222222222222222",
          maxTimeoutSeconds: 60,
          asset: USDC_TOKEN.address,
        },
      }),
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /settle — body validation", () => {
  it("returns 400 on malformed JSON", async () => {
    const res = await app.request("/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });
});

describe("404 handler", () => {
  it("returns structured 404 for unknown paths", async () => {
    const res = await app.request("/does-not-exist");
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string; path: string };
    expect(body.error).toBe("Not found");
    expect(body.path).toBe("/does-not-exist");
  });
});

void mockedReadContract;

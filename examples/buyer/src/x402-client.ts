/**
 * x402 client for Arc — handles the 402 → sign → retry dance.
 *
 * Public API:
 *   const client = new X402Client(buyerAccount);
 *   const { data, settlement } = await client.payAndFetch(url);
 */

import type { Address, Hex, LocalAccount } from "viem";

import {
  randomNonce,
  signEip3009Authorization,
  type SignedEip3009Authorization,
} from "./eip3009-signer.js";

const ARC_CAIP2 = "eip155:5042002" as const;

export type PaymentRequirements = {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  resource: string;
  description?: string;
  payTo: Address;
  maxTimeoutSeconds: number;
  asset: Address;
};

export type SettlementInfo = {
  success: boolean;
  transaction?: string;
  network?: string;
  payer?: string;
  errorReason?: string;
};

export type PaidFetchResult<T> = {
  data: T;
  settlement: SettlementInfo | null;
  rawResponse: Response;
};

function encodePaymentHeader(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

function decodePaymentResponseHeader(headerValue: string | null): SettlementInfo | null {
  if (!headerValue) return null;
  try {
    const json = Buffer.from(headerValue, "base64").toString("utf8");
    return JSON.parse(json) as SettlementInfo;
  } catch {
    return null;
  }
}

export class X402Client {
  constructor(private readonly account: LocalAccount) {}

  /**
   * Try to fetch a resource. If the seller returns 402, sign + retry.
   * Throws if the response is not 200 after retry.
   */
  async payAndFetch<T = unknown>(url: string): Promise<PaidFetchResult<T>> {
    // First request — no payment header.
    const initialRes = await fetch(url, { method: "GET" });

    if (initialRes.status === 200) {
      // Already free, no payment required.
      return {
        data: (await initialRes.json()) as T,
        settlement: null,
        rawResponse: initialRes,
      };
    }

    if (initialRes.status !== 402) {
      const text = await initialRes.text();
      throw new Error(
        `Unexpected initial status ${initialRes.status}: ${text.slice(0, 256)}`
      );
    }

    // Parse the 402 body to extract paymentRequirements.
    const challenge = (await initialRes.json()) as {
      x402Version?: number;
      accepts?: PaymentRequirements[];
    };
    if (
      !challenge.accepts ||
      challenge.accepts.length === 0 ||
      !challenge.accepts[0]
    ) {
      throw new Error("402 response missing 'accepts' list of payment requirements");
    }

    const requirements = challenge.accepts[0];

    if (requirements.scheme !== "exact") {
      throw new Error(`Unsupported scheme: ${requirements.scheme}`);
    }
    if (requirements.network !== ARC_CAIP2) {
      throw new Error(
        `Unsupported network: ${requirements.network} (only ${ARC_CAIP2} is supported)`
      );
    }

    // Build + sign the authorization.
    const now = BigInt(Math.floor(Date.now() / 1000));
    const validAfter = now - 60n; // 1 minute back
    const validBefore = now + BigInt(Math.max(60, requirements.maxTimeoutSeconds));

    const signed: SignedEip3009Authorization = await signEip3009Authorization(
      this.account,
      {
        from: this.account.address,
        to: requirements.payTo,
        value: BigInt(requirements.maxAmountRequired),
        validAfter,
        validBefore,
        nonce: randomNonce(),
      }
    );

    const paymentPayload = {
      x402Version: 1,
      scheme: requirements.scheme,
      network: requirements.network,
      payload: signed,
    };

    // Retry with X-PAYMENT header.
    const paidRes = await fetch(url, {
      method: "GET",
      headers: {
        "X-PAYMENT": encodePaymentHeader(paymentPayload),
      },
    });

    if (paidRes.status !== 200) {
      const text = await paidRes.text();
      throw new Error(
        `Paid request failed with HTTP ${paidRes.status}: ${text.slice(0, 512)}`
      );
    }

    const settlement = decodePaymentResponseHeader(
      paidRes.headers.get("X-PAYMENT-RESPONSE")
    );

    return {
      data: (await paidRes.json()) as T,
      settlement,
      rawResponse: paidRes,
    };
  }

  get address(): Address {
    return this.account.address;
  }

  // Type-guard helpers for callers
  static isHex(s: unknown): s is Hex {
    return typeof s === "string" && /^0x[a-fA-F0-9]*$/.test(s);
  }
}

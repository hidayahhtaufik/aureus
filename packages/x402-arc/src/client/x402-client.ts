/**
 * x402 client — handles the 402 → sign → retry flow against any x402 endpoint
 * that accepts the Arc USDC `exact` scheme.
 */

import { getAddress } from "viem";
import type { Address, LocalAccount } from "viem";

import { ARC_CAIP2 } from "../constants.js";
import { randomNonce } from "../eip3009.js";
import type { PaymentRequirements } from "../types.js";
import {
  signEip3009Authorization,
  type SignedEip3009Authorization,
} from "./signer.js";

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

function decodePaymentResponseHeader(
  headerValue: string | null
): SettlementInfo | null {
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

  get address(): Address {
    return this.account.address;
  }

  /**
   * GET a resource. If the seller responds 402, sign + retry with X-PAYMENT.
   * Throws if the response is not 200 even after retry.
   */
  async payAndFetch<T = unknown>(url: string): Promise<PaidFetchResult<T>> {
    const initialRes = await fetch(url, { method: "GET" });

    if (initialRes.status === 200) {
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

    const challenge = (await initialRes.json()) as {
      x402Version?: number;
      accepts?: PaymentRequirements[];
    };
    const requirements = challenge.accepts?.[0];
    if (!requirements) {
      throw new Error("402 response missing 'accepts' list of payment requirements");
    }

    if (requirements.scheme !== "exact") {
      throw new Error(`Unsupported scheme: ${requirements.scheme}`);
    }
    if (requirements.network !== ARC_CAIP2) {
      throw new Error(
        `Unsupported network: ${requirements.network} (only ${ARC_CAIP2} is supported)`
      );
    }

    const now = BigInt(Math.floor(Date.now() / 1000));
    const validAfter = now - 60n;
    const validBefore =
      now + BigInt(Math.max(60, requirements.maxTimeoutSeconds));

    const signed: SignedEip3009Authorization = await signEip3009Authorization(
      this.account,
      {
        from: this.account.address,
        to: getAddress(requirements.payTo),
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
}

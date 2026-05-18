/**
 * Thin HTTP client for an x402 facilitator (e.g. TalosFacilitator).
 *
 * Sellers use this from inside their request-handling code to forward x402
 * payment payloads to the facilitator's /verify and /settle endpoints.
 */

export type FacilitatorVerifyResponse =
  | { isValid: true; payer: string }
  | { isValid: false; invalidReason: string; payer?: string };

export type FacilitatorSettleResponse =
  | {
      success: true;
      transaction: string;
      network: string;
      payer: string;
    }
  | {
      success: false;
      errorReason: string;
      transaction?: string;
      network: string;
      payer?: string;
    };

export class FacilitatorClient {
  constructor(private readonly baseUrl: string) {}

  async verify(body: unknown): Promise<FacilitatorVerifyResponse> {
    const res = await fetch(`${this.baseUrl}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as FacilitatorVerifyResponse;
  }

  async settle(body: unknown): Promise<FacilitatorSettleResponse> {
    const res = await fetch(`${this.baseUrl}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as FacilitatorSettleResponse;
  }
}

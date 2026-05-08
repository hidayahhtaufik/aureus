/**
 * Thin HTTP client for the Aureus TalosFacilitator.
 *
 * Encapsulates the /verify and /settle calls so the middleware doesn't
 * have to know URL details.
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

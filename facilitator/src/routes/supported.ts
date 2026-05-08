import { Hono } from "hono";
import { ARC_CAIP2, USDC_TOKEN } from "../config/arc.js";
import type { SupportedResponse } from "../types/x402.js";

export const supportedRoute = new Hono();

/**
 * GET /supported
 *
 * Returns the list of (scheme, network, asset) combinations this facilitator
 * supports. Per x402 spec, this is what x402 clients query to discover
 * facilitator capabilities.
 *
 * v0.1: Arc Testnet + USDC via "exact" scheme (EIP-3009 path).
 */
supportedRoute.get("/", (c) => {
  const response: SupportedResponse = {
    kinds: [
      {
        x402Version: 1,
        scheme: "exact",
        network: ARC_CAIP2,
        extra: {
          name: "Arc Testnet",
          asset: {
            address: USDC_TOKEN.address,
            decimals: USDC_TOKEN.decimals,
            symbol: USDC_TOKEN.symbol,
            eip712: {
              name: USDC_TOKEN.eip712Name,
              version: USDC_TOKEN.eip712Version,
            },
          },
        },
      },
    ],
  };

  return c.json(response);
});

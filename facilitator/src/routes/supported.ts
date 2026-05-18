import { Hono } from "hono";

import { ARC_CAIP2, USDC_TOKEN, type SupportedResponse } from "@hidayahhtaufik/x402-arc";

export const supportedRoute = new Hono();

/**
 * GET /supported
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

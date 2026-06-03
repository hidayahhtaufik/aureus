import { createPublicClient, createWalletClient, fallback, http, type Transport } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet, ARC_TESTNET_RPC } from "@hidayahhtaufik/x402-arc";

/**
 * RPC transport. ARC_RPC_URL may be a comma-separated POOL of endpoints — we
 * build a viem fallback() across all of them (plus the package default as a
 * last resort), each with retries (viem backs off on 429). One provider hitting
 * its rate limit fails over to the next instead of failing the balance lookup
 * or the settle broadcast.
 */
function arcTransport(): Transport {
  const urls = [
    ...(process.env.ARC_RPC_URL ?? ARC_TESTNET_RPC).split(",").map((u) => u.trim()).filter(Boolean),
    ARC_TESTNET_RPC,
  ].filter((u, i, a) => a.indexOf(u) === i);
  return urls.length === 1
    ? http(urls[0], { retryCount: 3 })
    : fallback(urls.map((u) => http(u, { retryCount: 3 })));
}

/**
 * Public client for read-only Arc testnet calls.
 */
export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: arcTransport(),
});

/**
 * Wallet client for broadcasting settlement transactions.
 * Requires FACILITATOR_PRIVATE_KEY env var (funded with testnet USDC).
 *
 * Returns null if no private key is set (allows /verify-only mode).
 */
export function getWalletClient() {
  const pk = process.env.FACILITATOR_PRIVATE_KEY;
  if (!pk || pk === "0x0000000000000000000000000000000000000000000000000000000000000000") {
    return null;
  }

  const account = privateKeyToAccount(pk as `0x${string}`);

  return createWalletClient({
    account,
    chain: arcTestnet,
    transport: arcTransport(),
  });
}

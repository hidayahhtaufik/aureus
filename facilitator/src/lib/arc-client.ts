import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "../config/arc.js";

/**
 * Public client for read-only Arc testnet calls.
 */
export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network"),
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
    transport: http(process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network"),
  });
}

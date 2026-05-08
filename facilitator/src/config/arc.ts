import { defineChain } from "viem";

/**
 * Arc Testnet chain configuration for viem.
 *
 * Note on native currency: Arc uses USDC as its native gas token.
 * For gas accounting, Arc uses 18-decimal precision (eth_gasPrice returns
 * wei-style values), even though USDC's ERC-20 interface is 6-decimal.
 * For ERC-20 transfers, always use the USDC contract's own decimals (6).
 */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18, // gas accounting precision
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
      webSocket: ["wss://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

/**
 * Verified contract addresses on Arc Testnet.
 * Source: docs.arc.network/arc/references/contract-addresses (verified 2026-05-08)
 */
export const ARC_TESTNET_ADDRESSES = {
  USDC: "0x3600000000000000000000000000000000000000",
  EURC: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
  USYC: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C",
  PERMIT2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  CCTP_TOKEN_MESSENGER: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
  GATEWAY_WALLET: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
  GATEWAY_MINTER: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
  MULTICALL3: "0xcA11bde05977b3631167028862bE2a173976CA11",
} as const;

/**
 * USDC EIP-712 domain on Arc Testnet (verified via Foundry test 2026-05-08).
 * DOMAIN_SEPARATOR: 0x361191522483d32a83e70ae7183b4b9629442c13a78bc9921d6f707911c8c6b0
 */
export const USDC_EIP712_DOMAIN = {
  name: "USDC",
  version: "2",
  chainId: 5042002,
  verifyingContract: ARC_TESTNET_ADDRESSES.USDC,
} as const;

/**
 * USDC token metadata.
 */
export const USDC_TOKEN = {
  address: ARC_TESTNET_ADDRESSES.USDC,
  symbol: "USDC",
  decimals: 6, // ERC-20 transfer precision
  eip712Name: "USDC",
  eip712Version: "2",
} as const;

/**
 * CAIP-2 network identifier for Arc Testnet.
 */
export const ARC_CAIP2 = "eip155:5042002" as const;

/**
 * Arc Network constants — single source of truth for all consumers
 * (facilitator service, demo seller, demo buyer, future SDKs).
 *
 * All addresses verified against docs.arc.network/arc/references/contract-addresses
 * via Foundry tests on 2026-05-08.
 */

import { defineChain } from "viem";

// ---- Network identity ----

export const ARC_CHAIN_ID = 5042002;
export const ARC_CAIP2 = "eip155:5042002" as const;

export const ARC_TESTNET_RPC = "https://rpc.testnet.arc.network";
export const ARC_TESTNET_RPC_WS = "wss://rpc.testnet.arc.network";
export const ARC_TESTNET_EXPLORER = "https://testnet.arcscan.app";
export const ARC_TESTNET_FAUCET = "https://faucet.circle.com";

// ---- Verified contract addresses ----

export const ARC_TESTNET_ADDRESSES = {
  USDC: "0x3600000000000000000000000000000000000000",
  EURC: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
  USYC: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C",
  PERMIT2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  CCTP_TOKEN_MESSENGER: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
  CCTP_MESSAGE_TRANSMITTER: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
  CCTP_TOKEN_MINTER: "0xb43db544E2c27092c107639Ad201b3dEfAbcF192",
  CCTP_MESSAGE: "0xbaC0179bB358A8936169a63408C8481D582390C4",
  GATEWAY_WALLET: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
  GATEWAY_MINTER: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
  MULTICALL3: "0xcA11bde05977b3631167028862bE2a173976CA11",
} as const;

// ---- USDC token metadata ----

export const USDC_TOKEN = {
  address: ARC_TESTNET_ADDRESSES.USDC,
  symbol: "USDC",
  decimals: 6,
  eip712Name: "USDC",
  eip712Version: "2",
} as const;

/**
 * EIP-712 domain expected by Arc USDC's `transferWithAuthorization`.
 * Verified on-chain (USDC.DOMAIN_SEPARATOR matches keccak of these fields):
 *   0x361191522483d32a83e70ae7183b4b9629442c13a78bc9921d6f707911c8c6b0
 */
export const USDC_EIP712_DOMAIN = {
  name: "USDC",
  version: "2",
  chainId: ARC_CHAIN_ID,
  verifyingContract: ARC_TESTNET_ADDRESSES.USDC,
} as const;

// ---- Viem chain config ----

/**
 * Arc Testnet chain config.
 *
 * Note on native currency: Arc uses USDC as native gas token. Gas accounting
 * uses 18-decimal precision (eth_gasPrice returns wei-style values), even
 * though USDC's ERC-20 interface is 6 decimals. For ERC-20 transfers, always
 * use the USDC contract's `decimals()` (= 6).
 */
export const arcTestnet = defineChain({
  id: ARC_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [ARC_TESTNET_RPC],
      webSocket: [ARC_TESTNET_RPC_WS],
    },
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: ARC_TESTNET_EXPLORER,
    },
  },
  testnet: true,
});

import { ethers } from "ethers";
import { createPublicClient, defineChain, http } from "viem";
import { ApiPromise, WsProvider } from "@polkadot/api";

export const EVM_RPC_URLS = [
  "https://eth-rpc-testnet.polkadot.io/",
  "https://services.polkadothub-rpc.com/testnet/",
];
export const EVM_RPC_URL = EVM_RPC_URLS[0];
export const WS_RPC_URL  = "wss://asset-hub-paseo-rpc.n.dwellir.com";

export const westendAssetHub = defineChain({
  id: 420420417,
  name: "Polkadot Hub TestNet",
  nativeCurrency: { name: "Paseo", symbol: "PAS", decimals: 18 },
  rpcUrls: { default: { http: EVM_RPC_URLS } },
  testnet: true,
});

export function getEthersProvider(url: string = EVM_RPC_URL): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(url);
}

export function getViemClient(url: string = EVM_RPC_URL) {
  return createPublicClient({
    chain: westendAssetHub,
    transport: http(url),
  });
}

export async function getPapiApi(): Promise<ApiPromise> {
  const provider = new WsProvider(WS_RPC_URL);
  return ApiPromise.create({ provider });
}
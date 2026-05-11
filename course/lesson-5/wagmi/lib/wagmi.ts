import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { injected, metaMask } from "wagmi/connectors";

const POLKADOT_HUB_TESTNET_RPC =
  "https://services.polkadothub-rpc.com/testnet";

export const polkadotHubTestnet = defineChain({
  id: 420420417,
  name: "Polkadot Hub Testnet",
  nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 },
  rpcUrls: {
    default: { http: [POLKADOT_HUB_TESTNET_RPC] },
  },
});

const dappUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const config = createConfig({
  chains: [polkadotHubTestnet],
  connectors: [
    metaMask({
      dapp: { name: "Wallet balance", url: dappUrl },
    }),
    injected(),
  ],
  transports: {
    [polkadotHubTestnet.id]: http(POLKADOT_HUB_TESTNET_RPC),
  },
});

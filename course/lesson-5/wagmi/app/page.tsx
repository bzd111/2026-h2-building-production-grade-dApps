"use client";

import { formatUnits } from "viem";
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { polkadotHubTestnet } from "@/lib/wagmi";

export default function Home() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switchPending } = useSwitchChain();
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    chainId: polkadotHubTestnet.id,
  });

  // @wagmi/connectors v8: MetaMask connector id is `metaMaskSDK`, not `metaMask`
  const walletConnector =
    connectors.find(
      (c) => c.type === "metaMask" || c.id === "metaMaskSDK"
    ) ?? connectors.find((c) => c.id === "injected");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-zinc-50 text-zinc-900">
      <h1 className="text-xl font-semibold">Wallet balance</h1>

      <div className="flex flex-col gap-4 w-full max-w-md">
        {!isConnected ? (
          <button
            type="button"
            disabled={!walletConnector || isPending}
            onClick={() =>
              walletConnector &&
              connect({
                connector: walletConnector,
                chainId: polkadotHubTestnet.id,
              })
            }
            className="rounded-lg bg-zinc-900 px-4 py-3 text-white font-medium disabled:opacity-50 hover:bg-zinc-800"
          >
            {isPending ? "Connecting…" : "Connect MetaMask"}
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-zinc-600">
              {chain?.name ?? "Unknown network"}
            </p>
            <p className="text-xs font-mono break-all text-zinc-700">
              {address}
            </p>
            {chain?.id !== polkadotHubTestnet.id && (
              <button
                type="button"
                disabled={switchPending}
                onClick={() =>
                  switchChain({ chainId: polkadotHubTestnet.id })
                }
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 w-fit"
              >
                {switchPending ? "Switching…" : "Switch to Polkadot Hub Testnet"}
              </button>
            )}
            <button
              type="button"
              onClick={() => disconnect()}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 w-fit"
            >
              Disconnect
            </button>
          </div>
        )}

        {connectError && (
          <p className="text-sm text-red-600">{connectError.message}</p>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-600">Balance</span>
          <input
            readOnly
            value={
              !isConnected
                ? "Connect a wallet to see balance"
                : balanceLoading
                  ? "Loading…"
                  : balance
                    ? `${formatUnits(balance.value, balance.decimals)} ${balance.symbol}`
                    : "—"
            }
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm w-full"
          />
        </label>
      </div>
    </main>
  );
}

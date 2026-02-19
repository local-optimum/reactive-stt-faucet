"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { somniaTestnet } from "@/lib/chains";

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!isConnected || chainId === somniaTestnet.id) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 max-w-sm text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Wrong Network
          </h2>
          <p className="text-white/60 text-sm mb-6">
            Please switch to Somnia Testnet to use the faucet.
          </p>
          <button
            onClick={() => switchChain({ chainId: somniaTestnet.id })}
            className="px-6 py-3 bg-accent text-bg font-semibold rounded-xl
              hover:bg-accent/90 transition-colors"
          >
            Switch to Somnia Testnet
          </button>
        </div>
      </div>
    </>
  );
}

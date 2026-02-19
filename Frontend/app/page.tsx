"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import { HeroButton } from "@/components/HeroButton";
import { CooldownTimer } from "@/components/CooldownTimer";
import { LiveFeed } from "@/components/LiveFeed";
import { FaucetStats } from "@/components/FaucetStats";
import { NetworkGuard } from "@/components/NetworkGuard";
import { useEligibility } from "@/hooks/useEligibility";
import { useClaim } from "@/hooks/useClaim";
import { useLiveFeed } from "@/hooks/useLiveFeed";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { isEligible, isOnCooldown, balanceTooHigh, secondsLeft, balance, refetch } =
    useEligibility(address);
  const { claim, state } = useClaim(refetch);
  const events = useLiveFeed();

  const disabledReason = !isConnected
    ? "Connect Wallet"
    : balanceTooHigh
    ? "Balance Too High"
    : isOnCooldown
    ? "Cooldown Active"
    : undefined;

  return (
    <NetworkGuard>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold text-white/90">
            Somnia
          </span>
          <ConnectButton />
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center gap-8 px-4 pb-12">
          {/* Hero */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Reactive Testnet Faucet
            </h1>
            <p className="text-white/50 text-sm">
              0.5 STT &middot; 24h cooldown &middot; Powered by Somnia Reactivity
            </p>
          </div>

          {/* Two columns: Status + Stats */}
          <div className="flex flex-col sm:flex-row gap-6 items-stretch w-full max-w-lg">
            {/* Your Status */}
            <div className="flex-1 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4">
              <h2 className="text-xs text-white/50 uppercase tracking-wider">
                Your Status
              </h2>
              {isConnected && balance ? (
                <p className="text-sm text-white/80">
                  Balance:{" "}
                  <span className="text-white font-semibold">
                    {Number(formatEther(balance.value)).toFixed(4)} STT
                  </span>
                </p>
              ) : null}
              {isConnected && <CooldownTimer secondsLeft={secondsLeft} />}
              <HeroButton
                state={state}
                disabled={!isEligible || state !== "idle"}
                disabledReason={disabledReason}
                onClick={claim}
              />
            </div>

            {/* Faucet Status */}
            <div className="flex-1 flex flex-col gap-3">
              <FaucetStats />
            </div>
          </div>

          {/* Live Feed */}
          <LiveFeed events={events} />
        </main>
      </div>
    </NetworkGuard>
  );
}

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
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <span className="text-lg font-semibold text-white/90 tracking-tight">
            Somnia Testnet
          </span>
          <ConnectButton />
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center px-4 py-12">
          <div className="w-full max-w-lg flex flex-col gap-10">
            {/* Hero Title */}
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Reactive Testnet Faucet
              </h1>
              <p className="text-white/40 text-sm">
                1 STT &middot; 1h cooldown &middot; Powered by Somnia Reactivity
              </p>
            </div>

            {/* Claim Section */}
            <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-2xl p-8 sm:p-10 flex flex-col items-center gap-6">
              {isConnected && balance ? (
                <p className="text-sm text-white/60">
                  Your balance:{" "}
                  <span className="text-white font-semibold">
                    {Number(formatEther(balance.value)).toFixed(4)} STT
                  </span>
                </p>
              ) : null}

              {/* Button */}
              <div className="py-4">
                <HeroButton
                  state={state}
                  disabled={!isEligible || state !== "idle"}
                  disabledReason={disabledReason}
                  onClick={claim}
                />
              </div>

              {/* Cooldown timer */}
              {isConnected && <CooldownTimer secondsLeft={secondsLeft} />}
            </div>

            {/* Faucet Stats */}
            <FaucetStats />

            {/* Live Feed */}
            <LiveFeed events={events} />
          </div>
        </main>
      </div>
    </NetworkGuard>
  );
}

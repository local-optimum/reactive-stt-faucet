"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useEffect } from "react";
import { formatEther, formatUnits } from "viem";
import { HeroButton } from "@/components/HeroButton";
import { CooldownTimer } from "@/components/CooldownTimer";
import { LiveFeed } from "@/components/LiveFeed";
import { SttFaucetStats, TokenFaucetStats } from "@/components/FaucetStats";
import { NetworkGuard } from "@/components/NetworkGuard";
import { useEligibility } from "@/hooks/useEligibility";
import { useClaim } from "@/hooks/useClaim";
import { useTokenEligibility } from "@/hooks/useTokenEligibility";
import { useTokenClaim } from "@/hooks/useTokenClaim";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { TOKEN_FAUCET_HANDLER_ADDRESS } from "@/lib/contracts";

const hasTokenFaucet = TOKEN_FAUCET_HANDLER_ADDRESS && TOKEN_FAUCET_HANDLER_ADDRESS !== "0x";

function formatCooldown(secs: number): string {
  if (secs >= 3600) {
    const h = secs / 3600;
    return h === 1 ? "1h" : `${h}h`;
  }
  return `${secs / 60}m`;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { isEligible, isOnCooldown, balanceTooHigh, secondsLeft, cooldownSecs, balance, maxBal, drip, refetch } =
    useEligibility(address);
  const { claim, state } = useClaim(refetch);

  const tokenEligibility = useTokenEligibility(address);
  const tokenClaim = useTokenClaim(tokenEligibility.refetch);

  const events = useLiveFeed();

  // Refetch balances/cooldowns when a new live event arrives
  useEffect(() => {
    if (events.length > 0) {
      refetch();
      tokenEligibility.refetch();
    }
  }, [events.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxBalFormatted = Number(formatUnits(maxBal, 18));
  const sttDripFormatted = Number(formatEther(drip));
  const disabledReason = !isConnected
    ? "Connect Wallet"
    : balanceTooHigh
    ? `Balance ≥ ${maxBalFormatted} STT`
    : isOnCooldown
    ? "Cooldown Active"
    : undefined;

  const tokenDripFormatted = Number(formatUnits(tokenEligibility.drip, 6)).toLocaleString();
  const tokenMaxBalFormatted = Number(formatUnits(tokenEligibility.maxBal, 6)).toLocaleString();
  const tokenDisabledReason = !isConnected
    ? "Connect Wallet"
    : tokenEligibility.balanceTooHigh
    ? `Balance ≥ ${tokenMaxBalFormatted} SOMUSD`
    : tokenEligibility.isOnCooldown
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
                STT &amp; SOMUSD &middot; powered by on-chain Reactivity
              </p>
            </div>

            {/* STT Claim Section */}
            <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-2xl p-8 sm:p-10 flex flex-col items-center gap-6">
              <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider">STT Faucet</h2>
              <p className="text-white/40 text-xs">
                {sttDripFormatted} STT &middot; {formatCooldown(cooldownSecs)} cooldown &middot; {maxBalFormatted} STT max balance
              </p>

              {isConnected && balance ? (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-sm text-white/60">
                    Your balance:{" "}
                    <span className="text-white font-semibold">
                      {Number(formatEther(balance.value)).toFixed(4)} STT
                    </span>
                  </p>
                  {balanceTooHigh && (
                    <p className="text-xs text-red-400/80">
                      Must be below {maxBalFormatted} STT to claim
                    </p>
                  )}
                </div>
              ) : null}

              {/* Button */}
              <div className="py-4">
                <HeroButton
                  state={state}
                  disabled={!isEligible || state !== "idle"}
                  disabledReason={disabledReason}
                  onClick={claim}
                  tokenLabel="STT"
                  successLabel={`${sttDripFormatted} STT incoming!`}
                />
              </div>

              {/* Cooldown timer */}
              {isConnected && <CooldownTimer secondsLeft={secondsLeft} totalCooldown={cooldownSecs} />}

              {/* STT Stats */}
              <SttFaucetStats refetchKey={events.length} />
            </div>

            {/* SOMUSD Claim Section */}
            {hasTokenFaucet && (
              <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-2xl p-8 sm:p-10 flex flex-col items-center gap-6">
                <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider">SOMUSD Faucet</h2>
                <p className="text-white/40 text-xs">
                  {tokenDripFormatted} SOMUSD &middot; {formatCooldown(tokenEligibility.cooldownSecs)} cooldown &middot; {tokenMaxBalFormatted} SOMUSD max balance
                </p>

                {isConnected && tokenEligibility.tokenBalance !== undefined ? (
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm text-white/60">
                      Your balance:{" "}
                      <span className="text-white font-semibold">
                        {Number(formatUnits(tokenEligibility.tokenBalance, 6)).toLocaleString()} SOMUSD
                      </span>
                    </p>
                    {tokenEligibility.balanceTooHigh && (
                      <p className="text-xs text-red-400/80">
                        Must be below {tokenMaxBalFormatted} SOMUSD to claim
                      </p>
                    )}
                  </div>
                ) : null}

                {/* Button */}
                <div className="py-4">
                  <HeroButton
                    state={tokenClaim.state}
                    disabled={!tokenEligibility.isEligible || tokenClaim.state !== "idle"}
                    disabledReason={tokenDisabledReason}
                    onClick={tokenClaim.claim}
                    tokenLabel="SOMUSD"
                    successLabel={`${tokenDripFormatted} SOMUSD incoming!`}
                  />
                </div>

                {/* Cooldown timer */}
                {isConnected && (
                  <CooldownTimer
                    secondsLeft={tokenEligibility.secondsLeft}
                    totalCooldown={tokenEligibility.cooldownSecs}
                  />
                )}

                {/* SOMUSD Stats */}
                <TokenFaucetStats refetchKey={events.length} />
              </div>
            )}

            {/* Live Feed */}
            <LiveFeed events={events} />
          </div>
        </main>
        {/* Footer */}
        <footer className="py-6 text-center text-xs text-white/30">
          Built on Somnia, powered by{" "}
          <a href="https://docs.somnia.network/concepts/somnia-blockchain/on-chain-reactivity" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/50">
            reactivity
          </a>
          , by local-optimum &middot;{" "}
          <a href="https://github.com/local-optimum/reactive-stt-faucet" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/50">
            github
          </a>
        </footer>
      </div>
    </NetworkGuard>
  );
}

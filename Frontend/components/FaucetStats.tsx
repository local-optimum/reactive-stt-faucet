"use client";

import { useReadContract, useBalance } from "wagmi";
import { formatEther } from "viem";
import { FAUCET_HANDLER_ADDRESS, faucetHandlerABI } from "@/lib/contracts";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 text-center min-w-[140px]">
      <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-base font-semibold text-white whitespace-nowrap">{value}</p>
    </div>
  );
}

export function FaucetStats() {
  const { data: faucetBalance } = useBalance({
    address: FAUCET_HANDLER_ADDRESS,
    query: { refetchInterval: 30_000 },
  });

  const { data: totalGranted } = useReadContract({
    address: FAUCET_HANDLER_ADDRESS,
    abi: faucetHandlerABI,
    functionName: "totalGranted",
    query: { refetchInterval: 30_000 },
  });

  const { data: totalClaimers } = useReadContract({
    address: FAUCET_HANDLER_ADDRESS,
    abi: faucetHandlerABI,
    functionName: "totalClaimers",
    query: { refetchInterval: 30_000 },
  });

  return (
    <div className="flex flex-wrap justify-center gap-3 w-full max-w-xl mx-auto">
      <StatCard
        label="Faucet Balance"
        value={
          faucetBalance
            ? `${Number(formatEther(faucetBalance.value)).toFixed(1)} STT`
            : "..."
        }
      />
      <StatCard
        label="Total Granted"
        value={
          totalGranted !== undefined
            ? `${Number(formatEther(totalGranted)).toFixed(1)} STT`
            : "..."
        }
      />
      <StatCard
        label="Unique Claimers"
        value={totalClaimers !== undefined ? totalClaimers.toString() : "..."}
      />
    </div>
  );
}

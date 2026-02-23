"use client";

import { useReadContract, useBalance } from "wagmi";
import { formatEther, formatUnits } from "viem";
import {
  FAUCET_HANDLER_ADDRESS,
  faucetHandlerABI,
  TOKEN_FAUCET_HANDLER_ADDRESS,
  tokenFaucetHandlerABI,
  SOMUSD_ADDRESS,
  erc20ABI,
} from "@/lib/contracts";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-4 text-center">
      <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 whitespace-pre-line">{label}</p>
      <p className="text-base font-semibold text-white">{value}</p>
    </div>
  );
}

export function SttFaucetStats() {
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
    <div className="grid grid-cols-3 gap-3 w-full">
      <StatCard
        label={"Faucet\nBalance"}
        value={
          faucetBalance
            ? `${Number(formatEther(faucetBalance.value)).toFixed(1)} STT`
            : "..."
        }
      />
      <StatCard
        label={"Total\nGranted"}
        value={
          totalGranted !== undefined
            ? `${Number(formatEther(totalGranted)).toFixed(1)} STT`
            : "..."
        }
      />
      <StatCard
        label={"Unique\nClaimers"}
        value={totalClaimers !== undefined ? totalClaimers.toString() : "..."}
      />
    </div>
  );
}

export function TokenFaucetStats() {
  const { data: tokenHandlerBalance } = useReadContract({
    address: SOMUSD_ADDRESS,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [TOKEN_FAUCET_HANDLER_ADDRESS],
    query: { refetchInterval: 30_000 },
  });

  const { data: tokenTotalGranted } = useReadContract({
    address: TOKEN_FAUCET_HANDLER_ADDRESS,
    abi: tokenFaucetHandlerABI,
    functionName: "totalGranted",
    query: { refetchInterval: 30_000 },
  });

  const { data: tokenTotalClaimers } = useReadContract({
    address: TOKEN_FAUCET_HANDLER_ADDRESS,
    abi: tokenFaucetHandlerABI,
    functionName: "totalClaimers",
    query: { refetchInterval: 30_000 },
  });

  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      <StatCard
        label={"Faucet\nBalance"}
        value={
          tokenHandlerBalance !== undefined
            ? `${Number(formatUnits(tokenHandlerBalance, 6)).toLocaleString()}`
            : "..."
        }
      />
      <StatCard
        label={"Total\nGranted"}
        value={
          tokenTotalGranted !== undefined
            ? `${Number(formatUnits(tokenTotalGranted, 6)).toLocaleString()}`
            : "..."
        }
      />
      <StatCard
        label={"Unique\nClaimers"}
        value={tokenTotalClaimers !== undefined ? tokenTotalClaimers.toString() : "..."}
      />
    </div>
  );
}

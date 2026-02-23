"use client";

import { useEffect } from "react";
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

function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(1);
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-4 text-center">
      <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 whitespace-pre-line">{label}</p>
      <p className="text-base font-semibold text-white">{value}</p>
    </div>
  );
}

export function SttFaucetStats({ refetchKey }: { refetchKey?: number }) {
  const { data: faucetBalance, refetch: refetchBalance } = useBalance({
    address: FAUCET_HANDLER_ADDRESS,
    query: { refetchInterval: 30_000 },
  });

  const { data: totalGranted, refetch: refetchGranted } = useReadContract({
    address: FAUCET_HANDLER_ADDRESS,
    abi: faucetHandlerABI,
    functionName: "totalGranted",
    query: { refetchInterval: 30_000 },
  });

  const { data: totalClaimers, refetch: refetchClaimers } = useReadContract({
    address: FAUCET_HANDLER_ADDRESS,
    abi: faucetHandlerABI,
    functionName: "totalClaimers",
    query: { refetchInterval: 30_000 },
  });

  useEffect(() => {
    if (refetchKey && refetchKey > 0) {
      refetchBalance();
      refetchGranted();
      refetchClaimers();
    }
  }, [refetchKey, refetchBalance, refetchGranted, refetchClaimers]);

  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      <StatCard
        label={"Faucet\nBalance"}
        value={
          faucetBalance
            ? compactNumber(Number(formatEther(faucetBalance.value)))
            : "..."
        }
      />
      <StatCard
        label={"Total\nGranted"}
        value={
          totalGranted !== undefined
            ? compactNumber(Number(formatEther(totalGranted)))
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

export function TokenFaucetStats({ refetchKey }: { refetchKey?: number }) {
  const { data: tokenHandlerBalance, refetch: refetchBalance } = useReadContract({
    address: SOMUSD_ADDRESS,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [TOKEN_FAUCET_HANDLER_ADDRESS],
    query: { refetchInterval: 30_000 },
  });

  const { data: tokenTotalGranted, refetch: refetchGranted } = useReadContract({
    address: TOKEN_FAUCET_HANDLER_ADDRESS,
    abi: tokenFaucetHandlerABI,
    functionName: "totalGranted",
    query: { refetchInterval: 30_000 },
  });

  const { data: tokenTotalClaimers, refetch: refetchClaimers } = useReadContract({
    address: TOKEN_FAUCET_HANDLER_ADDRESS,
    abi: tokenFaucetHandlerABI,
    functionName: "totalClaimers",
    query: { refetchInterval: 30_000 },
  });

  useEffect(() => {
    if (refetchKey && refetchKey > 0) {
      refetchBalance();
      refetchGranted();
      refetchClaimers();
    }
  }, [refetchKey, refetchBalance, refetchGranted, refetchClaimers]);

  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      <StatCard
        label={"Faucet\nBalance"}
        value={
          tokenHandlerBalance !== undefined
            ? compactNumber(Number(formatUnits(tokenHandlerBalance, 6)))
            : "..."
        }
      />
      <StatCard
        label={"Total\nGranted"}
        value={
          tokenTotalGranted !== undefined
            ? compactNumber(Number(formatUnits(tokenTotalGranted, 6)))
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

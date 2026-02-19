"use client";

import { useReadContract, useBalance } from "wagmi";
import { useEffect, useState } from "react";
import { FAUCET_HANDLER_ADDRESS, faucetHandlerABI } from "@/lib/contracts";

const COOLDOWN = 24 * 60 * 60; // 24 hours in seconds

export function useEligibility(address: `0x${string}` | undefined) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  const { data: lastGrant, refetch: refetchLastGrant } = useReadContract({
    address: FAUCET_HANDLER_ADDRESS,
    abi: faucetHandlerABI,
    functionName: "lastGrant",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: balance, refetch: refetchBalance } = useBalance({
    address,
    query: { enabled: !!address },
  });

  const refetch = () => {
    refetchLastGrant();
    refetchBalance();
  };

  useEffect(() => {
    if (!lastGrant) {
      setSecondsLeft(0);
      return;
    }

    const lastGrantNum = Number(lastGrant);
    if (lastGrantNum === 0) {
      setSecondsLeft(0);
      return;
    }

    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - lastGrantNum;
      const remaining = Math.max(0, COOLDOWN - elapsed);
      setSecondsLeft(remaining);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastGrant]);

  const isOnCooldown = secondsLeft > 0;
  const balanceTooHigh =
    balance !== undefined && balance.value >= BigInt(1e18);
  const isEligible = !!address && !isOnCooldown && !balanceTooHigh;

  return {
    isEligible,
    isOnCooldown,
    balanceTooHigh,
    secondsLeft,
    balance,
    refetch,
  };
}

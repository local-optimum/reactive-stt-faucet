"use client";

import { useReadContract, useBalance } from "wagmi";
import { useEffect, useState } from "react";
import { FAUCET_HANDLER_ADDRESS, faucetHandlerABI } from "@/lib/contracts";

export function useEligibility(address: `0x${string}` | undefined) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  const { data: cooldown } = useReadContract({
    address: FAUCET_HANDLER_ADDRESS,
    abi: faucetHandlerABI,
    functionName: "cooldown",
  });

  const { data: maxBalance } = useReadContract({
    address: FAUCET_HANDLER_ADDRESS,
    abi: faucetHandlerABI,
    functionName: "maxBalance",
  });

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

  const cooldownSecs = cooldown ? Number(cooldown) : 3600;

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
      const remaining = Math.max(0, cooldownSecs - elapsed);
      setSecondsLeft(remaining);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastGrant, cooldownSecs]);

  const isOnCooldown = secondsLeft > 0;
  const maxBal = maxBalance ?? BigInt(5e18);
  const balanceTooHigh =
    balance !== undefined && balance.value >= maxBal;
  const isEligible = !!address && !isOnCooldown && !balanceTooHigh;

  return {
    isEligible,
    isOnCooldown,
    balanceTooHigh,
    secondsLeft,
    cooldownSecs,
    balance,
    maxBal,
    refetch,
  };
}

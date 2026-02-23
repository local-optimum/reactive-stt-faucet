"use client";

import { useReadContract } from "wagmi";
import { useEffect, useState } from "react";
import {
  TOKEN_FAUCET_HANDLER_ADDRESS,
  tokenFaucetHandlerABI,
} from "@/lib/contracts";

export function useTokenEligibility(address: `0x${string}` | undefined) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  const { data: cooldown } = useReadContract({
    address: TOKEN_FAUCET_HANDLER_ADDRESS,
    abi: tokenFaucetHandlerABI,
    functionName: "cooldown",
  });

  const { data: dripAmount } = useReadContract({
    address: TOKEN_FAUCET_HANDLER_ADDRESS,
    abi: tokenFaucetHandlerABI,
    functionName: "dripAmount",
  });

  const { data: lastGrant, refetch: refetchLastGrant } = useReadContract({
    address: TOKEN_FAUCET_HANDLER_ADDRESS,
    abi: tokenFaucetHandlerABI,
    functionName: "lastGrant",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const refetch = () => {
    refetchLastGrant();
  };

  const cooldownSecs = cooldown ? Number(cooldown) : 86400;

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
  const isEligible = !!address && !isOnCooldown;
  const drip = dripAmount ?? BigInt(1000 * 1e6);

  return {
    isEligible,
    isOnCooldown,
    secondsLeft,
    cooldownSecs,
    drip,
    refetch,
  };
}

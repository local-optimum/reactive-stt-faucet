"use client";

import { useEffect, useState, useCallback } from "react";
import { useWatchContractEvent } from "wagmi";
import { FAUCET_HANDLER_ADDRESS, faucetHandlerABI } from "@/lib/contracts";

export type FeedEvent = {
  id: string;
  address: `0x${string}`;
  type: "granted" | "denied";
  reason?: string;
  timestamp: number;
};

const MAX_EVENTS = 20;

export function useLiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);

  const addEvent = useCallback((event: FeedEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
  }, []);

  useWatchContractEvent({
    address: FAUCET_HANDLER_ADDRESS,
    abi: faucetHandlerABI,
    eventName: "FaucetGranted",
    onLogs: (logs) => {
      for (const log of logs) {
        addEvent({
          id: `${log.transactionHash}-${log.logIndex}`,
          address: log.args.requester as `0x${string}`,
          type: "granted",
          timestamp: Date.now(),
        });
      }
    },
  });

  useWatchContractEvent({
    address: FAUCET_HANDLER_ADDRESS,
    abi: faucetHandlerABI,
    eventName: "FaucetDenied",
    onLogs: (logs) => {
      for (const log of logs) {
        addEvent({
          id: `${log.transactionHash}-${log.logIndex}`,
          address: log.args.requester as `0x${string}`,
          type: "denied",
          reason: log.args.reason as string,
          timestamp: Date.now(),
        });
      }
    },
  });

  return events;
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPublicClient, webSocket, keccak256, toHex, decodeAbiParameters } from "viem";
import { SDK } from "@somnia-chain/reactivity";
import { somniaTestnet } from "@/lib/chains";
import { FAUCET_HANDLER_ADDRESS } from "@/lib/contracts";

export type FeedEvent = {
  id: string;
  address: `0x${string}`;
  type: "granted" | "denied";
  reason?: string;
  timestamp: number;
};

const MAX_EVENTS = 20;

const GRANTED_TOPIC = keccak256(toHex("FaucetGranted(address,uint256)"));
const DENIED_TOPIC = keccak256(toHex("FaucetDenied(address,string)"));

export function useLiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const subRef = useRef<{ unsubscribe: () => Promise<unknown> } | null>(null);

  const addEvent = useCallback((event: FeedEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const wsClient = createPublicClient({
        chain: somniaTestnet,
        transport: webSocket(somniaTestnet.rpcUrls.default.webSocket![0]),
      });

      const sdk = new SDK({ public: wsClient });

      const result = await sdk.subscribe({
        ethCalls: [],
        eventContractSources: [FAUCET_HANDLER_ADDRESS],
        onData: (data: { result: { topics: `0x${string}`[]; data: `0x${string}` } }) => {
          if (cancelled) return;
          const { topics, data: eventData } = data.result;
          const topic0 = topics[0];
          const requester = `0x${topics[1]?.slice(26)}` as `0x${string}`;
          const id = `${Date.now()}-${requester}`;

          if (topic0 === GRANTED_TOPIC) {
            addEvent({ id, address: requester, type: "granted", timestamp: Date.now() });
          } else if (topic0 === DENIED_TOPIC) {
            let reason = "cooldown";
            try {
              const [decoded] = decodeAbiParameters(
                [{ name: "reason", type: "string" }],
                eventData
              );
              reason = decoded;
            } catch {}
            addEvent({ id, address: requester, type: "denied", reason, timestamp: Date.now() });
          }
        },
        onError: (err: Error) => {
          console.error("Reactivity subscription error:", err);
        },
      });

      if (result instanceof Error) {
        console.error("Failed to create Reactivity subscription:", result.message);
        return;
      }

      if (!cancelled) {
        subRef.current = result;
      } else {
        result.unsubscribe();
      }
    }

    setup();

    return () => {
      cancelled = true;
      subRef.current?.unsubscribe();
      subRef.current = null;
    };
  }, [addEvent]);

  return events;
}

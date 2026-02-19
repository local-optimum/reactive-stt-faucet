"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { somniaTestnet } from "./chains";

export const config = getDefaultConfig({
  appName: "Reactive Testnet Faucet",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains: [somniaTestnet],
  ssr: true,
});

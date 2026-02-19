import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reactive Testnet Faucet",
  description: "Claim 0.5 STT on Somnia Testnet — powered by on-chain Reactivity",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-bg min-h-screen dot-grid antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

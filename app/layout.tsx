import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Thunderdome ⚡ Cross-Agent Negotiation Arena",
  description: "Watch AI agents negotiate, betray, and pay each other in real-time on Hedera Testnet via x402 micropayments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile server-only hedera SDK for client boundary
  serverExternalPackages: ["@hashgraph/sdk", "@x402/hedera", "@x402/core"],
};

export default nextConfig;

import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  // NEXT_PUBLIC_* is auto-exposed to client by Next.js — no need to list here.
  // Keep COMPETITION_CONTRACT for server-side API compat; NEXT_PUBLIC_ is read
  // client-side via process.env.NEXT_PUBLIC_COMPETITION_CONTRACT.
  env: {
    COMPETITION_CONTRACT: process.env.COMPETITION_CONTRACT || process.env.NEXT_PUBLIC_COMPETITION_CONTRACT,
    TREASURY_PRIZE_CONTRACT:
      process.env.TREASURY_PRIZE_CONTRACT || process.env.NEXT_PUBLIC_TREASURY_PRIZE_CONTRACT,
  },
}

export default nextConfig



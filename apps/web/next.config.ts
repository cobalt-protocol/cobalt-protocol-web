import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  env: {
    COMPETITION_CONTRACT: process.env.COMPETITION_CONTRACT,
    TREASURY_PRIZE_CONTRACT: process.env.TREASURY_PRIZE_CONTRACT,
  },
}

export default nextConfig



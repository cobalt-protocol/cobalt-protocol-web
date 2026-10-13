import { createPublicClient, http, type PublicClient } from "viem"
import { botChainTestnet } from "./wagmi"

export const publicClient: PublicClient = createPublicClient({
  chain: botChainTestnet,
  transport: http()
})

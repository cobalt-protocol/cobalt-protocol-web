import { createConfig, http } from "wagmi"
import { injected } from "wagmi/connectors"
import { defineChain } from "viem"

export const botChainTestnet = defineChain({
  id: 84421,
  name: "BotChain Testnet",
  nativeCurrency: {
    name: "BotChain Token",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.botchain.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "BotChain Explorer",
      url: "https://testnet-explorer.botchain.ai",
    },
  },
  testnet: true,
})

export const wagmiConfig = createConfig({
  chains: [botChainTestnet],
  connectors: [
    injected(),
  ],
  ssr: true,
  transports: {
    [botChainTestnet.id]: http(),
  },
})

export async function addBotChainTestnetToWallet() {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    try {
      await (window as any).ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${botChainTestnet.id.toString(16)}`,
            chainName: botChainTestnet.name,
            nativeCurrency: botChainTestnet.nativeCurrency,
            rpcUrls: botChainTestnet.rpcUrls.default.http,
            blockExplorerUrls: [botChainTestnet.blockExplorers.default.url],
          },
        ],
      })
      return true
    } catch (err) {
      console.error("Failed to add BotChain Testnet network:", err)
      return false
    }
  }
  return false
}


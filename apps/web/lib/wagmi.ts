import { createConfig, http } from "wagmi"
import { injected, metaMask } from "wagmi/connectors"
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
    metaMask(),
  ],
  ssr: true,
  transports: {
    [botChainTestnet.id]: http(),
  },
})

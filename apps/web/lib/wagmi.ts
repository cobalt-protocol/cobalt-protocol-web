import { createConfig, http } from "wagmi"
import { injected, metaMask } from "wagmi/connectors"
import { defineChain } from "viem"

export const botChainTestnet = defineChain({
  id: 968,
  name: "BotChain Testnet",
  nativeCurrency: {
    name: "BotChain Token",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.bohr.life"],
    },
  },
  blockExplorers: {
    default: {
      name: "BotChain Explorer",
      url: "https://scan.bohr.life/",
    },
  },
  testnet: true,
})

export const wagmiConfig = createConfig({
  chains: [botChainTestnet],
  connectors: [
    metaMask(),
    injected(),
  ],
  ssr: true,
  transports: {
    [botChainTestnet.id]: http(),
  },
})

export async function connectMetaMaskDirectly() {
  if (typeof window === "undefined") return null
  const eth = (window as any).ethereum
  if (!eth) return null

  const provider =
    eth.providers && Array.isArray(eth.providers)
      ? eth.providers.find((p: any) => p.isMetaMask) || eth
      : eth

  // 1. Request accounts (triggers MetaMask connect popup window)
  const accounts = await provider.request({ method: "eth_requestAccounts" })

  // 2. Switch network to BotChain Testnet (Chain ID 968 / 0x3c8)
  const hexChainId = `0x${botChainTestnet.id.toString(16)}`
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexChainId }],
    })
  } catch (switchError: any) {
    if (
      switchError?.code === 4902 ||
      switchError?.data?.originalError?.code === 4902 ||
      String(switchError?.message || "").includes("4902")
    ) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hexChainId,
            chainName: botChainTestnet.name,
            nativeCurrency: botChainTestnet.nativeCurrency,
            rpcUrls: botChainTestnet.rpcUrls.default.http,
            blockExplorerUrls: [botChainTestnet.blockExplorers.default.url],
          },
        ],
      })
    }
  }

  return accounts
}

export async function addBotChainTestnetToWallet() {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    const eth = (window as any).ethereum
    const provider =
      eth.providers && Array.isArray(eth.providers)
        ? eth.providers.find((p: any) => p.isMetaMask) || eth
        : eth
    try {
      await provider.request({
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


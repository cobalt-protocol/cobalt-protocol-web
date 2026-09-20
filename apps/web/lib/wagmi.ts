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
  if (typeof window === "undefined") {
    alert("Browser environment not ready.")
    return null
  }

  const eth = (window as any).ethereum
  if (!eth) {
    alert("MetaMask wallet extension is not installed in your browser. Please install MetaMask to connect.")
    return null
  }

  const provider =
    eth.providers && Array.isArray(eth.providers)
      ? eth.providers.find((p: any) => p.isMetaMask) || eth
      : eth

  let accounts: string[] = []
  try {
    accounts = await provider.request({ method: "eth_requestAccounts" })
  } catch (err: any) {
    if (err?.code === 4001 || String(err?.message || "").includes("rejected")) {
      throw err
    }
    try {
      await provider.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      })
      accounts = await provider.request({ method: "eth_accounts" })
    } catch (permErr: any) {
      throw err
    }
  }

  // Switch network to BotChain Testnet (Chain ID 968 / 0x3c8)
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
      try {
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
      } catch (addErr) {
        console.error("Add chain error:", addErr)
      }
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


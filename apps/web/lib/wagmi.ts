import { createConfig, http } from "wagmi"
import { getDefaultConfig } from "connectkit"
import { defineChain, createWalletClient, custom } from "viem"

// Global trap for Object.defineProperty(window, 'ethereum') to prevent uncaught "Cannot redefine property: ethereum"
if (typeof window !== "undefined") {
  const originalDefineProperty = Object.defineProperty
  try {
    Object.defineProperty = function (
      obj: any,
      prop: PropertyKey,
      attributes: PropertyDescriptor & PropertyDescriptorMap
    ) {
      if (obj === window && prop === "ethereum") {
        try {
          return originalDefineProperty.call(this, obj, prop, attributes)
        } catch (err) {
          console.warn("Prevented non-configurable window.ethereum redefinition error:", err)
          return obj
        }
      }
      return originalDefineProperty.call(this, obj, prop, attributes)
    }
  } catch (_) {}

  // Global trap for browser wallet extension unhandled promise rejections (e.g., Aave Account SDK, EIP1193 connection timeout, MetaMask session restore)
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason
    const message = reason?.message || String(reason || "")
    const stack = reason?.stack || ""
    const fullStr = `${message} ${stack} ${String(reason)}`
    if (
      fullStr.includes("Aave") ||
      fullStr.includes("AaveAccount") ||
      fullStr.includes("EIP1193") ||
      fullStr.includes("lazy connection") ||
      fullStr.includes("MetaMask") ||
      fullStr.includes("restoring session") ||
      fullStr.includes("chrome-extension://") ||
      fullStr.includes("moz-extension://")
    ) {
      console.warn("Prevented unhandled browser extension rejection:", message || reason)
      event.preventDefault()
    }
  })
}

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

export const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "Cobalt Protocol",
    appDescription: "Autonomous Agent & DeFi Protocol",
    appUrl: "https://cobalt.life",
    appIcon: "/icon.webp",
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "c4f79cc821944d9680842e34466bfb00",
    chains: [botChainTestnet],
    transports: {
      [botChainTestnet.id]: http(),
    },
    ssr: true,
  })
)

export async function connectMetaMaskDirectly() {
  return connectInjectedWalletDirectly()
}

export async function connectInjectedWalletDirectly() {
  if (typeof window === "undefined") {
    alert("Browser environment not ready.")
    return null
  }

  const eth = (window as any).ethereum
  if (!eth) {
    alert("Tidak ada ekstensi dompet Web3 yang terdeteksi di browser Anda. Silakan pasang ekstensi dompet Web3 (seperti Phantom, MetaMask, atau Rabby) untuk terhubung.")
    return null
  }

  // Candidates: Try window.ethereum root object first, then any extra providers in eth.providers
  const candidates: any[] = [eth]

  if (eth.providers && Array.isArray(eth.providers)) {
    for (const p of eth.providers) {
      if (!candidates.includes(p)) candidates.push(p)
    }
  }

  let accounts: string[] = []
  let activeProvider: any = null
  let lastError: any = null

  // Step 1: Request accounts via eth_requestAccounts or enable on available providers
  for (const provider of candidates) {
    try {
      if (typeof provider.request === "function") {
        const res = await provider.request({ method: "eth_requestAccounts" })
        if (res && res.length > 0) {
          accounts = Array.from(res)
        }
      } else if (typeof provider.enable === "function") {
        const res = await provider.enable()
        if (res && res.length > 0) {
          accounts = Array.from(res)
        }
      }
      if (accounts && accounts.length > 0) {
        activeProvider = provider
        break
      }
    } catch (err: any) {
      const errMsg = String(err?.message || "").toLowerCase()
      if (err?.code === 4001 || errMsg.includes("rejected")) {
        throw err
      }
      if (errMsg.includes("cannot redefine property") || errMsg.includes("redefine property")) {
        console.warn("Ignored ethereum redefinition error during requestAccounts:", err)
        continue
      }
      lastError = err
    }
  }

  // Step 2: Fallback check eth_accounts
  if (!accounts || accounts.length === 0) {
    for (const provider of candidates) {
      try {
        if (typeof provider.request === "function") {
          const res = await provider.request({ method: "eth_accounts" })
          if (res && res.length > 0) {
            accounts = Array.from(res)
            activeProvider = provider
            break
          }
        }
      } catch (err: any) {
        const errMsg = String(err?.message || "").toLowerCase()
        if (err?.code === 4001 || errMsg.includes("rejected")) {
          throw err
        }
        if (errMsg.includes("cannot redefine property") || errMsg.includes("redefine property")) {
          console.warn("Ignored ethereum redefinition error during eth_accounts:", err)
          continue
        }
        lastError = err
      }
    }
  }

  if (!accounts || accounts.length === 0) {
    if (
      lastError?.code === -32002 ||
      String(lastError?.message || "").toLowerCase().includes("already processing") ||
      String(lastError?.message || "").toLowerCase().includes("resource unavailable")
    ) {
      throw lastError
    }
    return null
  }

  // Auto-switch network to BotChain Testnet (Chain ID 968 / 0x3c8)
  const hexChainId = `0x${botChainTestnet.id.toString(16)}`
  if (activeProvider && typeof activeProvider.request === "function") {
    try {
      await activeProvider.request({
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
          await activeProvider.request({
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
  }

  return accounts
}

export async function disconnectMetaMaskDirectly() {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    return
  }

  const eth = (window as any).ethereum
  const providers = eth.providers && Array.isArray(eth.providers) ? eth.providers : [eth]

  for (const provider of providers) {
    try {
      if (typeof provider.request === "function") {
        await provider.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        })
      }
    } catch (_) {}
  }
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


export async function signMessageWithViem(
  address: string,
  message: string
): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Browser environment not ready.")
  }

  const eth = (window as any).ethereum
  if (!eth) {
    throw new Error("No Web3 wallet extension found.")
  }

  const provider =
    eth.providers && Array.isArray(eth.providers)
      ? eth.providers.find((p: any) => p.isMetaMask || p.isPhantom || p.isRabby) || eth
      : eth

  const walletClient = createWalletClient({
    chain: botChainTestnet,
    transport: custom(provider),
  })

  return await walletClient.signMessage({
    account: address as `0x${string}`,
    message,
  })
}



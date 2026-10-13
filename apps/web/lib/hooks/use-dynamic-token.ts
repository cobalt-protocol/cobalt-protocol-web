import { useAccount, useReadContracts } from "wagmi"
import { erc20Abi, isAddress, zeroAddress } from "viem"

export function useDynamicTokenInfo(tokenAddress?: string | null) {
  const { chain } = useAccount()
  const nativeSymbol = chain?.nativeCurrency?.symbol ?? "BOT"

  const normalized = tokenAddress?.trim() ?? ""
  const isNative =
    !normalized ||
    normalized.toLowerCase() === zeroAddress.toLowerCase() ||
    normalized === "0x0"

  const isNonNative = Boolean(!isNative && isAddress(normalized))

  const { data, isLoading, isError } = useReadContracts({
    contracts: isNonNative
      ? [
          { address: normalized as `0x${string}`, abi: erc20Abi, functionName: "decimals" },
          { address: normalized as `0x${string}`, abi: erc20Abi, functionName: "symbol" },
        ]
      : [],
    query: {
      enabled: isNonNative,
      staleTime: Infinity,
    },
  })

  if (isNative) {
    return {
      decimals: 18 as number | undefined,
      symbol: nativeSymbol as string | undefined,
      isLoading: false,
      isError: false,
      isNative: true as const,
    }
  }

  return {
    decimals: data?.[0]?.result as number | undefined,
    symbol: data?.[1]?.result as string | undefined,
    isLoading,
    isError,
    isNative: false as const,
  }
}

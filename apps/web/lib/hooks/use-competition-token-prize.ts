import { useReadContract, useChainId } from "wagmi"
import { isAddress, getAddress } from "viem"
import CompetitionManagerABI from "@/abi/CompetitionManager.json"

export const DEPLOYED_COMPETITION = "0xD9e56794a88F4Ad06B46d6e13712900103AC1e44" as const

export function getCompetitionContractAddress(): `0x${string}` {
  const _rawCompEnv = (process.env.NEXT_PUBLIC_COMPETITION_CONTRACT || process.env.COMPETITION_CONTRACT || '').trim().replace(/^['"]|['"]$/g, '').trim()
  return (_rawCompEnv && isAddress(_rawCompEnv) ? getAddress(_rawCompEnv) : DEPLOYED_COMPETITION) as `0x${string}`
}

export function useCompetitionTokenPrize(onchainCompetitionId?: string | number | bigint | null) {
  const chainId = useChainId()
  const contractAddress = getCompetitionContractAddress()
  
  const numericId = typeof onchainCompetitionId === 'string' && /^\d+$/.test(onchainCompetitionId)
    ? BigInt(onchainCompetitionId)
    : typeof onchainCompetitionId === 'number'
      ? BigInt(onchainCompetitionId)
      : typeof onchainCompetitionId === 'bigint'
        ? onchainCompetitionId
        : undefined

  const { data, isError, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: CompetitionManagerABI,
    functionName: "treasuryPrizeByCompetitionId",
    args: numericId !== undefined ? [numericId] : undefined,
    query: {
      enabled: numericId !== undefined,
    },
  })

  // treasuryPrizeByCompetitionId returns:
  // [id (uint256), competitionId (uint256), organization (address), totalPrize (uint256), tokenAddress (address)]
  
  let total_prize: string | undefined = undefined
  let token_address: string | undefined = undefined

  if (data && Array.isArray(data) && data.length >= 5) {
    total_prize = data[3]?.toString()
    token_address = data[4]?.toString()
  }

  return {
    data: data ? {
      total_prize,
      token_address,
      onchain_competition_id: numericId?.toString()
    } : null,
    isLoading,
    isError,
    refetch
  }
}

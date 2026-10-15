import { useReadContract, useChainId } from "wagmi"
import { isAddress, getAddress } from "viem"
import CompetitionManagerABI from "@/abi/CompetitionManager.json"

import { getCompetitionContractAddress } from "@/lib/contracts"
export { getCompetitionContractAddress }

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

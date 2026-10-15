import { getAddress, isAddress } from "viem"

function normalizeAddress(raw?: string | null): `0x${string}` | null {
  if (!raw) return null
  const cleaned = raw.trim().replace(/^['"]|['"]$/g, "").trim()
  return isAddress(cleaned) ? getAddress(cleaned) : null
}

/**
 * Returns the CompetitionManager contract address configured via NEXT_PUBLIC_COMPETITION_CONTRACT.
 * Throws an Error if not configured in environment variables to prevent silent fallback mismatches.
 */
export function getCompetitionContractAddress(): `0x${string}` {
  const addr = normalizeAddress(
    process.env.NEXT_PUBLIC_COMPETITION_CONTRACT || process.env.COMPETITION_CONTRACT
  )
  if (!addr) {
    throw new Error(
      "NEXT_PUBLIC_COMPETITION_CONTRACT is not set in environment variables. Please check your .env file."
    )
  }
  return addr
}

/**
 * Returns the Treasury Prize contract address from NEXT_PUBLIC_TREASURY_PRIZE_CONTRACT,
 * or falls back to the CompetitionManager contract address if unified.
 */
export function getTreasuryPrizeContractAddress(): `0x${string}` | null {
  return normalizeAddress(
    process.env.NEXT_PUBLIC_TREASURY_PRIZE_CONTRACT || process.env.TREASURY_PRIZE_CONTRACT
  )
}

/**
 * Returns the Treasury Platform contract address from NEXT_PUBLIC_TREASURY_PLATFORM_CONTRACT.
 */
export function getTreasuryPlatformContractAddress(): `0x${string}` | null {
  return normalizeAddress(
    process.env.NEXT_PUBLIC_TREASURY_PLATFORM_CONTRACT || process.env.TREASURY_PLATFORM_CONTRACT
  )
}

/**
 * Returns the Price Competition Manager contract address from NEXT_PUBLIC_PRICE_COMPETITION_MANAGER_CONTRACT.
 */
export function getPriceCompetitionManagerContractAddress(): `0x${string}` | null {
  return normalizeAddress(
    process.env.NEXT_PUBLIC_PRICE_COMPETITION_MANAGER_CONTRACT || process.env.PRICE_COMPETITION_MANAGER_CONTRACT
  )
}

/**
 * Returns the Listing Token Prize contract address from NEXT_PUBLIC_LISTING_TOKEN_PRIZE_CONTRACT.
 */
export function getListingTokenPrizeContractAddress(): `0x${string}` | null {
  return normalizeAddress(
    process.env.NEXT_PUBLIC_LISTING_TOKEN_PRIZE_CONTRACT || process.env.LISTING_TOKEN_PRIZE_CONTRACT
  )
}


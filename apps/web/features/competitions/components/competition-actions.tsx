"use client"
import { useMemo, useState } from "react"
import { useAccount } from "wagmi"
import { formatUnits } from "viem"
import { useSiteActions } from "@/components/layout/site-actions"
import { Button } from "@workspace/ui/components/button"
import { Share2 } from "lucide-react"
import { getTokenByAddress, getTokenSymbol } from "@/lib/tokens"
import { useDynamicTokenInfo } from "@/lib/hooks/use-dynamic-token"
import type { RegistrationCompetition } from "@/features/registration/types"

function isFreeFee(fee: unknown): boolean {
  if (fee === undefined || fee === null) return true
  const str = String(fee).trim()
  if (str === "" || str.toLowerCase() === "null" || str.toLowerCase() === "undefined") return true
  const num = Number(str)
  if (!isNaN(num) && num === 0) return true
  return false
}

function formatFeeDisplay(
  fee: unknown,
  tokenAddress?: string | null,
  chainNativeSymbol?: string,
  dynamicDecimals?: number,
  dynamicSymbol?: string
): string | null {
  if (isFreeFee(fee)) return null
  const raw = String(fee).trim()
  const token = getTokenByAddress(tokenAddress)
  const symbol = dynamicSymbol || getTokenSymbol(tokenAddress, chainNativeSymbol)
  const decimals = dynamicDecimals ?? token.decimals ?? 18

  // Treat fee as raw atomic amount ALWAYS
  try {
    const bigVal = BigInt(raw)
    const formattedStr = formatUnits(bigVal, decimals)
    const numVal = parseFloat(formattedStr)
    if (!isNaN(numVal)) {
      return `${numVal.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${symbol}`
    }
    return `${formattedStr} ${symbol}`
  } catch {
    // fallback if somehow not a pure integer string
    const numVal = Number(raw)
    if (!isNaN(numVal)) {
      return `${numVal.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${symbol}`
    }
    return `${raw} ${symbol}`
  }
}

export function CompetitionActions({
  competition,
}: {
  competition: RegistrationCompetition
}) {
  const { register, showNotice } = useSiteActions()
  const { chain } = useAccount()
  const [isRegistering, setIsRegistering] = useState(false)

  const { decimals: fetchedDecimals, symbol: fetchedSymbol } = useDynamicTokenInfo(competition.fee_token_address)

  const isFree = useMemo(() => isFreeFee(competition.fee), [competition.fee])
  const feeFormatted = useMemo(
    () =>
      formatFeeDisplay(
        competition.fee,
        competition.fee_token_address,
        chain?.nativeCurrency?.symbol,
        fetchedDecimals,
        fetchedSymbol
      ),
    [competition.fee, competition.fee_token_address, chain?.nativeCurrency?.symbol, fetchedDecimals, fetchedSymbol]
  )
  const registerLabel = isFree
    ? "Register for Free →"
    : feeFormatted
      ? `Register — ${feeFormatted} →`
      : "Register →"

  async function handleRegister() {
    if (isRegistering) return
    setIsRegistering(true)
    try {
      // Refetches the latest "me" profile before deciding the next step.
      await register(competition)
    } finally {
      setIsRegistering(false)
    }
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showNotice("Competition link copied.")
    } catch {
      showNotice(
        "Could not copy the link. You can copy the URL from your browser’s address bar."
      )
    }
  }
  return (
    <div className="mt-6 flex gap-3">
      <Button
        onClick={handleRegister}
        disabled={isRegistering}
        className="h-11 px-5"
      >
        {isRegistering ? "Checking profile…" : registerLabel}
      </Button>
      <Button
        variant="secondary"
        aria-label="Copy competition link"
        className="h-11 w-11"
        onClick={share}
      >
        <Share2 size={17} />
      </Button>
    </div>
  )
}

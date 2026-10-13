import {
  ArrowRight,
  Blocks,
  Eye,
  Users,
  UserPlus,
  Wallet,
  Zap,
} from "lucide-react"
import { useAccount, useChainId } from "wagmi"
import { useQuery } from "@tanstack/react-query"
import type { DashboardCompetition, DashboardPhase } from "../types"
import { phaseBadges } from "../lib/dashboard-selectors"
import { formatMoney } from "@/lib/format"
import { useDynamicTokenInfo } from "@/lib/hooks/use-dynamic-token"
import { useCompetitionTokenPrize } from "@/lib/hooks/use-competition-token-prize"
import { convertTokenOnChain } from "@/lib/token-convert"
import { useMemo } from "react"
import { fetchTokenPrizeByCompetitionId, formatTokenPrize } from "@/lib/competitions-api"

const phaseStyles: Record<
  DashboardPhase,
  { border: string; dot: string; button: string }
> = {
  registration: {
    border: "border-l-[#c5c6d7]",
    dot: "bg-slate-500",
    button: "bg-[#e5edff] text-foreground hover:bg-blue-100",
  },
  submission: {
    border: "border-l-[#004bd0]",
    dot: "bg-[#004bd0]",
    button: "bg-[#004bd0] text-white hover:bg-blue-800",
  },
  judging: {
    border: "border-l-amber-500",
    dot: "bg-amber-500",
    button: "bg-[#e5edff] text-foreground hover:bg-blue-100",
  },
  announcement: {
    border: "border-l-purple-500",
    dot: "bg-purple-500",
    button: "bg-[#e5edff] text-foreground hover:bg-blue-100",
  },
  claim: {
    border: "border-l-[#00655b]",
    dot: "bg-[#00655b]",
    button: "bg-[#00655b] text-white hover:bg-teal-800",
  },
  closed: {
    border: "border-l-[#596174]",
    dot: "bg-[#596174]",
    button: "bg-[#e5edff] text-foreground hover:bg-blue-100",
  },
}
export function JoinedCompetitionRow({
  competition,
  onAction,
}: {
  competition: DashboardCompetition
  onAction: () => void
}) {
  const { chain } = useAccount()
  const chainId = useChainId()
  const txHash =
    competition.txHash ||
    competition.tx_hash ||
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  const explorerBaseUrl = (
    chain?.blockExplorers?.default?.url || "https://scan.bohr.life"
  ).replace(/\/$/, "")
  const explorerUrl = `${explorerBaseUrl}/tx/${txHash}`

  const styles = phaseStyles[competition.phase]
  const ActionIcon =
    competition.phase === "registration"
      ? UserPlus
      : competition.phase === "claim"
        ? Wallet
        : competition.phase === "closed"
          ? Eye
          : ArrowRight
  const OrganizerIcon = competition.phase === "closed" ? Blocks : Zap

  // Prize Pool Capacity on-chain dari GET /api/v1/chains/:chainId/teams -> competition.prize_deposits[0]
  // Spec: hanya prize_deposits[0].amount + token_address (single entry, not sum), fallback 0 jika array kosong
  // Dikonsumsi via DashboardCompetition.prizeDeposits[0] yang diset di dashboard-selectors dari team.competition.prize_deposits[0]
  const prizeDeposits = (competition as any).prizeDeposits as import("@/lib/competitions-api").ApiPrizeDeposit[] | null | undefined
  const prizeDepositsTotalRaw = (competition as any).prizeDepositsTotalRaw as string | null | undefined
  // Prize Pool Capacity = prize_deposits[0].amount; token from [0].token_address (USDT 6 decimals), not fee_token fallback
  const hasPrizeDeposits = Boolean(prizeDeposits && prizeDeposits.length > 0 && prizeDepositsTotalRaw)
  const prizeDepositsTokenAddress = hasPrizeDeposits
    ? (prizeDeposits![0]?.token_address || prizeDeposits!.find((d) => Boolean(d.token_address))?.token_address || (competition.tokenAddress as string | null) || null)
    : null

  const compIdOrSlug = competition.competitionId || competition.competitionSlug || (competition.source === "local" ? competition.id : null)

  const onchainCompId = competition.rawTokenPrize?.onchain_competition_id || (competition as any).onchainCompetitionId || (typeof compIdOrSlug === "string" && /^\d+$/.test(compIdOrSlug) ? compIdOrSlug : null);
  const { data: fetchedTokenPrize } = useCompetitionTokenPrize(onchainCompId);

  const tokenPrize = competition.rawTokenPrize || fetchedTokenPrize
  // Prioritas: prize_deposits amount+token_address (on-chain) > tokenPrize fallback
  const primaryRaw = hasPrizeDeposits ? prizeDepositsTotalRaw! : (tokenPrize?.total_prize ? String(tokenPrize.total_prize) : null)
  const primaryTokenAddress = hasPrizeDeposits
    ? prizeDepositsTokenAddress
    : (competition.tokenAddress || tokenPrize?.token_address || null)
  const tokenAddressToFetch = primaryTokenAddress
  const { decimals, symbol: dynamicSymbol } = useDynamicTokenInfo(tokenAddressToFetch)

  const { data: convertedTotalPrize } = useQuery({
    queryKey: ["convert-total-prize-row", competition.id, tokenAddressToFetch, primaryRaw],
    queryFn: async () => {
      if (!primaryRaw) return null
      return await convertTokenOnChain(
        (tokenAddressToFetch || "0x0000000000000000000000000000000000000000") as string,
        primaryRaw
      )
    },
    enabled: Boolean(primaryRaw),
    staleTime: 60_000,
  })

  const { amountDisplay, symbolDisplay } = useMemo(() => {
    if (convertedTotalPrize) {
      return {
        amountDisplay: convertedTotalPrize.convertedAmount,
        symbolDisplay: convertedTotalPrize.symbol,
      }
    }

    // Jika prize_deposits ada, tokenPrizeFormatted sudah = formatTokenPrize(prizeDepositsTotalRaw, prizeDepositsTokenAddress) via dashboard-selectors
    // Jadi fallback ini sudah on-chain-aware (via formatTokenPrize dengan decimals/symbol dinamis)
    let formatted = competition.tokenPrizeFormatted || `${formatMoney(competition.amountUsd)} ${competition.currency}`
    
    if (hasPrizeDeposits && prizeDepositsTotalRaw) {
      formatted = formatTokenPrize(
        prizeDepositsTotalRaw,
        prizeDepositsTokenAddress,
        chain?.nativeCurrency?.symbol,
        decimals,
        dynamicSymbol || undefined
      )
    } else if (tokenPrize && tokenPrize.total_prize !== undefined && tokenPrize.total_prize !== null) {
      formatted = formatTokenPrize(
        tokenPrize.total_prize,
        tokenAddressToFetch,
        chain?.nativeCurrency?.symbol,
        decimals,
        dynamicSymbol || (tokenPrize as any)?.symbol || (tokenPrize as any)?.token_symbol || undefined
      )
    }
    
    const lastSpaceIndex = formatted.lastIndexOf(" ")
    if (lastSpaceIndex !== -1) {
      return {
        amountDisplay: formatted.slice(0, lastSpaceIndex),
        symbolDisplay: formatted.slice(lastSpaceIndex + 1),
      }
    }
    return { amountDisplay: formatted, symbolDisplay: "" }
  }, [competition, tokenPrize, chain?.nativeCurrency?.symbol, decimals, dynamicSymbol, tokenAddressToFetch, convertedTotalPrize])

  const isDisabled = Boolean(competition.pending)

  return (
    <article
      className={`flex flex-col justify-between gap-6 rounded-xl border-l-[6px] bg-white px-5 py-7 shadow-xs sm:px-6 lg:min-h-36 lg:flex-row lg:items-center ${styles.border}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#dde4ff] px-2.5 py-1 text-[10px] font-semibold text-slate-600">
            {competition.category}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e5edff] px-2.5 py-1 text-[11px] text-slate-700">
            <span className={`size-2 rounded-full ${styles.dot}`} />
            {competition.pending
              ? "Join Request Pending"
              : phaseBadges[competition.phase]}
          </span>
        </div>
        <h3 className="mt-3 text-lg leading-snug font-bold tracking-tight sm:text-xl">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-primary hover:underline"
          >
            {competition.title}
          </a>
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <span className="inline-flex items-center gap-1">
            <OrganizerIcon size={14} className="text-slate-500" />
            {competition.organizer}
          </span>
          <span aria-hidden="true" className="text-slate-500">
            ·
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={14} className="text-slate-500" />
            {competition.teamName}
            {competition.memberCount !== null &&
              ` (${competition.memberCount} members)`}
          </span>
        </div>
      </div>
      <div className="shrink-0 lg:w-64 lg:text-right">
        <p
          className={`text-[10px] uppercase ${competition.phase === "claim" ? "font-bold text-teal-800" : "text-slate-600"}`}
        >
          {competition.poolLabel}
        </p>
        <p
          className={`mt-1 text-xl font-extrabold tracking-tight flex items-baseline gap-1.5 lg:justify-end ${competition.phase === "claim" ? "text-teal-800" : ""}`}
        >
          <span>{amountDisplay}</span>
          {symbolDisplay && (
            <span className={`text-[11px] font-medium ${competition.phase === "claim" ? "text-teal-700" : "text-muted-foreground"}`}>
              {symbolDisplay}
            </span>
          )}
        </p>
        <button
          disabled={isDisabled}
          onClick={onAction}
          className={`mt-1 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${styles.button} ${isDisabled ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`}
        >
          {competition.phase === "claim" && <ActionIcon size={16} />}
          {competition.actionLabel}
          {competition.phase !== "claim" && <ActionIcon size={16} />}
        </button>
      </div>
    </article>
  )
}

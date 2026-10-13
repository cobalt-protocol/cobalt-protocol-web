"use client"

import React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Bot,
  Clock3,
  Landmark,
  Leaf,
  Palette,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import { Badge, primaryLinkClass } from "@/components/ui/page-primitives"
import { zeroAddress } from "viem"
import { formatNumber } from "@/lib/format"
import { routes } from "@/lib/routes"
import { formatTokenPrize, getTokenSymbol } from "@/lib/competitions-api"
import { useDynamicTokenInfo } from "@/lib/hooks/use-dynamic-token"
import { useCompetitionTokenPrize } from "@/lib/hooks/use-competition-token-prize"

import { convertTokenOnChain } from "@/lib/token-convert"

import { getDaysRemaining } from "../lib/competition-selectors"
import type { Competition, CompetitionIcon } from "../types"

const icons: Record<CompetitionIcon, LucideIcon> = {
  bot: Bot,
  landmark: Landmark,
  leaf: Leaf,
  palette: Palette,
  shield: ShieldCheck,
}

export function CompetitionCard({
  competition,
  referenceDate,
}: {
  competition: Competition
  referenceDate?: string
}) {
  const Icon = icons[competition.icon]
  const { chain } = useAccount()
  const connectedNativeSymbol = chain?.nativeCurrency?.symbol

  const txHash =
    competition.txHash ||
    competition.tx_hash ||
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  const explorerBaseUrl = (chain?.blockExplorers?.default?.url || "https://scan.bohr.life").replace(/\/$/, "")
  const explorerUrl = `${explorerBaseUrl}/tx/${txHash}`

  // Prize vault di homepage HARUS render dari API:
  // GET /api/v1/chains/<chain_id>/competitions -> competition.prize_deposits[0] { token_address, amount }
  // lalu filter on-chain persis seperti scripts/token_info.py:
  // - zero address -> native (decimals 18, symbol = chain.nativeCurrency.symbol)
  // - ERC20 -> readContract decimals()/symbol() via viem, lalu formatUnits(raw, decimals)
  // Contoh: 3120000 + 0x75edC9335175Fc0552D51D48439F229c10420fe3 (USDT 6 dec) -> 3.12 USDT
  // Treasury on-chain (treasuryPrizeByCompetitionId) dipakai hanya sebagai fallback bila prize_deposits kosong.
  const { data: tokenPrizeData, isLoading: isLoadingTokenPrize } = useCompetitionTokenPrize(competition.onchainCompetitionId)

  const vaultDeposit = (competition.prizeDeposits?.[0] ?? null) as { token_address?: string | null; amount?: string | number | null } | null
  const vaultRawFromDeposit = vaultDeposit?.amount ?? (competition as any).prizeDepositsTotalRaw ?? null
  const vaultTokenAddrFromDeposit = vaultDeposit?.token_address ?? null

  const vaultRaw: string | null = (() => {
    if (vaultRawFromDeposit !== null && vaultRawFromDeposit !== undefined && String(vaultRawFromDeposit).trim() !== "") {
      const s = String(vaultRawFromDeposit).trim()
      return s
    }
    if (tokenPrizeData?.total_prize !== null && tokenPrizeData?.total_prize !== undefined && String(tokenPrizeData.total_prize).trim() !== "") {
      return String(tokenPrizeData.total_prize).trim()
    }
    return null
  })()

  const vaultTokenAddress: string | null =
    (vaultTokenAddrFromDeposit && String(vaultTokenAddrFromDeposit).trim() ? String(vaultTokenAddrFromDeposit).trim() : null) ||
    (tokenPrizeData?.token_address && String(tokenPrizeData.token_address).trim() ? String(tokenPrizeData.token_address).trim() : null) ||
    (competition.fee_token_address && String(competition.fee_token_address).trim() ? String(competition.fee_token_address).trim() : null) ||
    ((competition as any).tokenAddress && String((competition as any).tokenAddress).trim() ? String((competition as any).tokenAddress).trim() : null) ||
    null

  const hasVaultRaw = Boolean(vaultRaw && vaultRaw !== "0")

  const { decimals, symbol: dynamicSymbol, isLoading: isLoadingDynamic } = useDynamicTokenInfo(vaultTokenAddress)

  const { data: convertedVaultPrize, isLoading: isLoadingConverted } = useQuery({
    queryKey: ["convert-vault-prize", vaultTokenAddress ?? zeroAddress, vaultRaw],
    queryFn: async () => {
      if (!vaultRaw) return null
      const addr = vaultTokenAddress || zeroAddress
      return await convertTokenOnChain(addr, vaultRaw)
    },
    enabled: Boolean(vaultRaw),
    staleTime: 60_000,
  })

  const prizeDisplay = React.useMemo(() => {
    const isLoadingAny = (hasVaultRaw && (isLoadingConverted || isLoadingDynamic)) || (!hasVaultRaw && isLoadingTokenPrize)
    if (isLoadingAny) {
      return <span className="text-sm font-medium text-muted-foreground animate-pulse">Loading...</span>
    }

    if (convertedVaultPrize) {
      return (
        <>
          {convertedVaultPrize.convertedAmount}{" "}
          <span className="text-[10px] font-medium text-teal-700">
            {convertedVaultPrize.symbol}
          </span>
        </>
      )
    }

    if (vaultRaw) {
      const fallbackSymbolFromTreasury = (tokenPrizeData as any)?.token_symbol || (tokenPrizeData as any)?.symbol || undefined
      const formatted = formatTokenPrize(
        vaultRaw,
        vaultTokenAddress,
        connectedNativeSymbol,
        decimals,
        dynamicSymbol || fallbackSymbolFromTreasury
      )
      // formatTokenPrize sudah mengembalikan "amount symbol" dengan locale 6 digit, cocok untuk 3120000 + 6 dec -> "3.12 USDT"
      // Bila decimals masih loading (undefined) dan token belum dikenal, fallback tetap pakai tokenCurrency yang benar
      // daripada hardcode 18 decimals -> 0.00000000000312.
      if (dynamicSymbol === undefined && decimals === undefined && !fallbackSymbolFromTreasury) {
        // masih loading on-chain symbol/decimals -> tampilkan Loading, bukan 0 USDT palsu
        // tapi karena enabled staleTime Infinity, decimals akan ke-resolve segera
      }
      const lastSpaceIndex = formatted.lastIndexOf(" ")
      if (lastSpaceIndex !== -1) {
        const amount = formatted.slice(0, lastSpaceIndex)
        const symbol = formatted.slice(lastSpaceIndex + 1)
        // Jika symbol kosong (unknown token) biarkan amount tetap tampil tanpa hardcode USDT
        if (!symbol) return <>{amount}</>
        return (
          <>
            {amount}{" "}
            <span className="text-[10px] font-medium text-teal-700">
              {symbol}
            </span>
          </>
        )
      }
      return formatted
    }

    // Tidak ada prize_deposits dan tidak ada treasuryPrize -> 0 dengan symbol native yang benar, bukan hardcode 6 USDT
    const emptySymbol = getTokenSymbol(vaultTokenAddress, connectedNativeSymbol, dynamicSymbol || undefined) || connectedNativeSymbol || "BOT"
    return (
      <>
        0{" "}
        <span className="text-[10px] font-medium text-teal-700">
          {emptySymbol}
        </span>
      </>
    )
  }, [vaultRaw, hasVaultRaw, isLoadingConverted, isLoadingDynamic, isLoadingTokenPrize, convertedVaultPrize, vaultTokenAddress, connectedNativeSymbol, decimals, dynamicSymbol, tokenPrizeData])

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/50 bg-white">
      <div className="flex-1 bg-secondary/60 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-blue-100 p-2 text-primary">
            <Icon size={23} />
          </span>
          <span className="text-[11px] font-bold">{competition.organizer}</span>
          <span className="ml-auto">
            <Badge
              tone={
                competition.status === "registration-open" ? "green" : "neutral"
              }
            >
              ●{" "}
              {competition.status === "closing-soon"
                ? "Closing Soon"
                : competition.status === "completed"
                  ? "Completed"
                  : "Registration Open"}
            </Badge>
          </span>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded bg-blue-100 px-1.5 py-0.5 font-bold text-primary">
            {competition.tag}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock3 size={12} />
            {getDaysRemaining(
              competition.endsAt,
              referenceDate
            )}{" "}
            days left
          </span>
        </div>
        <h3 className="mt-2 text-lg leading-snug font-extrabold tracking-tight">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-primary transition-colors"
          >
            {competition.title}
          </a>
        </h3>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {competition.description}
        </p>
      </div>
      <div className="p-5">
        <p className="text-xs text-muted-foreground">
          {formatNumber(competition.participants)} participants ·{" "}
          {formatNumber(competition.teamCount)} teams
        </p>
        <div className="my-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">
              Prize vault
            </p>
            <strong className="text-xl font-extrabold">
              {prizeDisplay}
            </strong>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase">
              Formation
            </p>
            <strong className="text-xs">
              1–{competition.maxTeamSize} members
            </strong>
          </div>
        </div>
        <Link
          href={routes.competition(competition.id)}
          className={primaryLinkClass + " w-full"}
        >
          View Details <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  )
}

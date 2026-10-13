"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import { zeroAddress } from "viem"
import { Badge, Panel, primaryLinkClass } from "@/components/ui/page-primitives"
import { formatNumber } from "@/lib/format"
import { routes } from "@/lib/routes"
import {
  formatTokenPrize,
  getTokenSymbol,
  parse18DecimalAmount,
} from "@/lib/competitions-api"
import { useDynamicTokenInfo } from "@/lib/hooks/use-dynamic-token"
import { useCompetitionTokenPrize } from "@/lib/hooks/use-competition-token-prize"
import { convertTokenOnChain, type ConvertTokenResult } from "@/lib/token-convert"

import { Download, LockKeyhole } from "lucide-react"
import Link from "next/link"
import type { Competition } from "../types"
import { CompetitionActions } from "./competition-actions"

export function CompetitionOverview({
  competition,
  workspace = false,
}: {
  competition: Competition
  workspace?: boolean
}) {
  const { chain } = useAccount()
  const connectedNativeSymbol = chain?.nativeCurrency?.symbol

  const txHash =
    competition.txHash ||
    competition.tx_hash ||
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  const explorerBaseUrl = (chain?.blockExplorers?.default?.url || "https://scan.bohr.life").replace(/\/$/, "")
  const explorerUrl = `${explorerBaseUrl}/tx/${txHash}`

  const { data: tokenPrizeData, isLoading: isLoadingTokenPrize } = useCompetitionTokenPrize(competition.onchainCompetitionId)

  // Prize vault / Total guaranteed prize MUST render from API:
  // GET /api/v1/chains/<chain_id>/competitions -> competition.prize_deposits[0] { token_address, amount }
  // on-chain via convertTokenOnChain / useDynamicTokenInfo (decimals/symbol), same as competition-card.tsx
  // Example: 3120000 + 0x75edC9335175Fc0552D51D48439F229c10420fe3 (USDT 6 dec) -> 3.12 USDT
  // Treasury on-chain is only fallback when prize_deposits empty.
  const vaultDeposit = (competition.prizeDeposits?.[0] ?? null) as { token_address?: string | null; amount?: string | number | null } | null
  const vaultRawFromDeposit = vaultDeposit?.amount ?? (competition as any).prizeDepositsTotalRaw ?? null
  const vaultTokenAddrFromDeposit = vaultDeposit?.token_address ?? null

  const vaultRaw: string | null = (() => {
    if (vaultRawFromDeposit !== null && vaultRawFromDeposit !== undefined && String(vaultRawFromDeposit).trim() !== "") {
      const s = String(vaultRawFromDeposit).trim()
      if (s === "0") return null
      return s
    }
    if (tokenPrizeData?.total_prize !== null && tokenPrizeData?.total_prize !== undefined && String(tokenPrizeData.total_prize).trim() !== "" && String(tokenPrizeData.total_prize).trim() !== "0") {
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
    queryKey: ["convert-vault-prize-detail", vaultTokenAddress ?? zeroAddress, vaultRaw],
    queryFn: async () => {
      if (!vaultRaw) return null
      const addr = vaultTokenAddress || zeroAddress
      return await convertTokenOnChain(addr, vaultRaw)
    },
    enabled: Boolean(vaultRaw),
    staleTime: 60_000,
  })

  const { data: convertedPrizes } = useQuery({
    queryKey: ["prize-allocation-conversion", vaultTokenAddress, competition.prizes],
    queryFn: async () => {
      const results: Record<string, ConvertTokenResult> = {}
      const targetToken = vaultTokenAddress || "0x0000000000000000000000000000000000000000"

      await Promise.all(
        competition.prizes.map(async (prize) => {
          if (prize.rawAmount) {
            try {
              results[prize.id] = await convertTokenOnChain(targetToken, prize.rawAmount)
            } catch (err) {
              console.warn(`Failed to convert prize ${prize.id} in allocation:`, err)
            }
          }
        })
      )
      return results
    },
    enabled: Boolean(competition.prizes && competition.prizes.length > 0),
    staleTime: 60_000,
  })

  const { amountDisplay, symbolDisplay, rawFormatted } = React.useMemo(() => {
    const isLoadingAny = (hasVaultRaw && (isLoadingConverted || isLoadingDynamic)) || (!hasVaultRaw && isLoadingTokenPrize)
    if (isLoadingAny) {
      return { amountDisplay: "Loading...", symbolDisplay: "", rawFormatted: "Loading..." }
    }
    if (convertedVaultPrize) {
      return {
        amountDisplay: convertedVaultPrize.convertedAmount,
        symbolDisplay: convertedVaultPrize.symbol,
        rawFormatted: convertedVaultPrize.formatted,
      }
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
      const lastSpaceIndex = formatted.lastIndexOf(" ")
      if (lastSpaceIndex !== -1) {
        return {
          amountDisplay: formatted.slice(0, lastSpaceIndex),
          symbolDisplay: formatted.slice(lastSpaceIndex + 1),
          rawFormatted: formatted,
        }
      }
      return { amountDisplay: formatted, symbolDisplay: "", rawFormatted: formatted }
    }
    // No escrow yet (no prize_deposits and no treasuryPrize) -> 0 with correct native symbol, not hardcode 6 USDT
    const emptySymbol = getTokenSymbol(vaultTokenAddress, connectedNativeSymbol, dynamicSymbol || undefined) || connectedNativeSymbol || "BOT"
    return {
      amountDisplay: "0",
      symbolDisplay: emptySymbol,
      rawFormatted: `0 ${emptySymbol}`,
    }
  }, [vaultRaw, hasVaultRaw, isLoadingConverted, isLoadingDynamic, isLoadingTokenPrize, connectedNativeSymbol, vaultTokenAddress, decimals, dynamicSymbol, convertedVaultPrize, tokenPrizeData])

  const totalPrizeAmount = React.useMemo(() => {
    return competition.prizes.reduce((sum, prize) => {
      const converted = convertedPrizes?.[prize.id];
      const amount = converted
        ? Number(converted.convertedAmount)
        : prize.rawAmount && decimals !== undefined
        ? parse18DecimalAmount(prize.rawAmount, decimals)
        : prize.rawAmount && isLoadingDynamic
        ? 0
        : prize.amount;
      return sum + amount;
    }, 0);
  }, [competition.prizes, decimals, isLoadingDynamic, convertedPrizes]);

  return (
    <Panel className="grid items-center gap-8 bg-linear-to-br from-white to-blue-50/40 md:p-9 lg:grid-cols-[1.35fr_1fr]">
      <div>
        <Badge>{competition.category.toUpperCase()}</Badge>
        <h1 className="mt-4 text-2xl leading-snug font-extrabold tracking-tight md:text-3xl">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-primary transition-colors"
          >
            {competition.title}
          </a>
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {competition.description}
        </p>
        {workspace ? (
          <div className="mt-6">
            {competition.guidebookUrl ? (
              <a
                href={competition.guidebookUrl}
                className={primaryLinkClass}
                download
              >
                Download Guidebook <Download size={15} />
              </a>
            ) : (
              <>
                <button
                  disabled
                  className={
                    primaryLinkClass + " cursor-not-allowed opacity-50"
                  }
                >
                  Guidebook not uploaded <Download size={15} />
                </button>
                <p className="mt-2 text-xs text-muted-foreground">
                  The organizer has not provided a guidebook yet.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <CompetitionActions competition={competition} />
            <p className="mt-4 text-xs text-muted-foreground">
              ● {formatNumber(competition.participants)} participants ·{" "}
              {competition.teamCount} teams
            </p>
            <Link
              href={routes.workspace(competition.id)}
              className="mt-3 inline-block text-xs font-semibold text-primary underline underline-offset-4"
            >
              Preview participant workspace
            </Link>
          </>
        )}
      </div>
      <div className="relative overflow-hidden rounded-xl bg-secondary/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">
            Total guaranteed prize
          </p>
          <Badge tone="green">
            <LockKeyhole size={11} />
            Escrow preview
          </Badge>
        </div>
        <p className="mt-4 text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
          {amountDisplay}{" "}
          {symbolDisplay && (
            <span className="text-sm font-medium text-muted-foreground">
              {symbolDisplay}
            </span>
          )}
        </p>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Pre-funded prize pool design for {chain?.name ? chain.name : "the connected network"}. Escrow funding and
          payout verification will appear here once the wallet integration is
          available.
        </p>
        <div className="mt-5 rounded-lg bg-white p-4">
          <div className="flex justify-between gap-3 text-xs">
            <span>Prize allocation</span>
            <strong>{rawFormatted}</strong>
          </div>
          {competition.prizes.length > 0 ? (
            <>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full">
                {competition.prizes.map((prize, index) => {
                  const converted = convertedPrizes?.[prize.id];
                  const currentAmount = converted
                    ? Number(converted.convertedAmount)
                    : prize.rawAmount && decimals !== undefined
                    ? parse18DecimalAmount(prize.rawAmount, decimals)
                    : prize.rawAmount && isLoadingDynamic
                    ? 0
                    : prize.amount;
                  const total = totalPrizeAmount;
                  const width = total > 0 ? (currentAmount / total) * 100 : 0;
                  const barColors = ["bg-primary", "bg-teal-500", "bg-amber-500", "bg-purple-500", "bg-rose-500", "bg-indigo-500"];
                  return (
                    <span
                      key={prize.id}
                      style={{
                        width: `${width}%`,
                      }}
                      className={barColors[index % barColors.length]}
                    />
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                {competition.prizes.map((prize, index) => {
                  const converted = convertedPrizes?.[prize.id];
                  const currentAmount = converted
                    ? Number(converted.convertedAmount)
                    : prize.rawAmount && decimals !== undefined
                    ? parse18DecimalAmount(prize.rawAmount, decimals)
                    : prize.rawAmount && isLoadingDynamic
                    ? 0
                    : prize.amount;
                  const displayFormattedAmount = converted
                    ? converted.convertedAmount
                    : isLoadingDynamic && prize.rawAmount && decimals === undefined
                    ? "…"
                    : currentAmount.toLocaleString("en-US", { maximumFractionDigits: 6 });
                  const total = totalPrizeAmount;
                  const pct = total > 0 ? Math.round((currentAmount / total) * 100) : 0;
                  const dotColors = ["bg-primary", "bg-teal-500", "bg-amber-500", "bg-purple-500", "bg-rose-500", "bg-indigo-500"];
                  return (
                    <div key={prize.id} className="flex items-center justify-between gap-2 rounded-md bg-secondary/40 px-2.5 py-1.5 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotColors[index % dotColors.length]}`} />
                        <span className="truncate font-medium text-foreground">{prize.title}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                        <span>{displayFormattedAmount} {converted?.symbol || symbolDisplay || competition.currency}</span>
                        <span className="text-[10px] text-teal-700 font-bold">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2.5 text-[10px] text-muted-foreground">
                {competition.prizes.length} award categories
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              No individual prize allocations configured yet.
            </p>
          )}
        </div>
      </div>
    </Panel>
  )
}

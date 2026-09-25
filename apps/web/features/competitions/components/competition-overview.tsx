"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import { Badge, Panel, primaryLinkClass } from "@/components/ui/page-primitives"
import { formatMoney, formatNumber } from "@/lib/format"
import { routes } from "@/lib/routes"
import {
  fetchTokenPrizeByCompetitionId,
  formatTokenPrize,
  getTokenSymbol,
} from "@/lib/competitions-api"
import { Download, LockKeyhole } from "lucide-react"
import Link from "next/link"
import { getPrizeTotal } from "../lib/competition-selectors"
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
  const competitionId = competition.id || competition.slug

  const { data: tokenPrizeData, isLoading: isLoadingTokenPrize } = useQuery({
    queryKey: ["competition-token-prize", competitionId],
    queryFn: () => fetchTokenPrizeByCompetitionId(competitionId),
    enabled: Boolean(competitionId),
  })

  const { amountDisplay, symbolDisplay, rawFormatted } = React.useMemo(() => {
    if (isLoadingTokenPrize) {
      return { amountDisplay: "Loading...", symbolDisplay: "", rawFormatted: "Loading..." }
    }
    if (tokenPrizeData && tokenPrizeData.total_prize !== undefined && tokenPrizeData.total_prize !== null) {
      const formatted = formatTokenPrize(
        tokenPrizeData.total_prize,
        tokenPrizeData.token_address,
        connectedNativeSymbol,
        18,
        (tokenPrizeData.token_symbol || tokenPrizeData.symbol) ?? undefined
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
    const fallbackAmount = formatMoney(getPrizeTotal(competition))
    const fallbackSymbol = competition.currency || getTokenSymbol(null, connectedNativeSymbol)
    return {
      amountDisplay: fallbackAmount,
      symbolDisplay: fallbackSymbol,
      rawFormatted: `${fallbackAmount} ${fallbackSymbol}`,
    }
  }, [tokenPrizeData, isLoadingTokenPrize, connectedNativeSymbol, competition])

  return (
    <Panel className="grid items-center gap-8 bg-linear-to-br from-white to-blue-50/40 md:p-9 lg:grid-cols-[1.35fr_1fr]">
      <div>
        <Badge>{competition.category.toUpperCase()}</Badge>
        <h1 className="mt-4 text-2xl leading-snug font-extrabold tracking-tight md:text-3xl">
          {competition.title}
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
          Pre-funded prize pool design for Arbitrum One. Escrow funding and
          payout verification will appear here once the wallet integration is
          available.
        </p>
        <div className="mt-5 rounded-lg bg-white p-4">
          <div className="flex justify-between gap-3 text-xs">
            <span>Prize allocation</span>
            <strong>{rawFormatted}</strong>
          </div>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full">
            {competition.prizes.map((prize, index) => {
              const total = getPrizeTotal(competition);
              const width = total > 0 ? (prize.amount / total) * 100 : 0;
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
              const total = getPrizeTotal(competition);
              const pct = total > 0 ? Math.round((prize.amount / total) * 100) : 0;
              const dotColors = ["bg-primary", "bg-teal-500", "bg-amber-500", "bg-purple-500", "bg-rose-500", "bg-indigo-500"];
              return (
                <div key={prize.id} className="flex items-center justify-between gap-2 rounded-md bg-secondary/40 px-2.5 py-1.5 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotColors[index % dotColors.length]}`} />
                    <span className="truncate font-medium text-foreground">{prize.title}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                    <span>{formatMoney(prize.amount)}</span>
                    <span className="text-[10px] text-teal-700 font-bold">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2.5 text-[10px] text-muted-foreground">
            {competition.prizes.length} award categories
          </p>
        </div>
      </div>
    </Panel>
  )
}

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
import { formatNumber } from "@/lib/format"
import { routes } from "@/lib/routes"
import { fetchTokenPrizeByCompetitionId, formatTokenPrize, getTokenSymbol } from "@/lib/competitions-api"
import { getDaysRemaining, getPrizeTotal } from "../lib/competition-selectors"
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

  const rawTxHash = competition.txHash || competition.tx_hash || "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  const txHash = rawTxHash.startsWith("0x") ? rawTxHash : `0x${rawTxHash}`
  const explorerBaseUrl = (chain?.blockExplorers?.default?.url || "https://scan.bohr.life").replace(/\/$/, "")
  const explorerUrl = `${explorerBaseUrl}/tx/${txHash}`

  const { data: tokenPrizeData } = useQuery({
    queryKey: ["competition-token-prize", competition.id],
    queryFn: () => fetchTokenPrizeByCompetitionId(competition.id),
    enabled: Boolean(competition.id),
  })

  const prizeDisplay = React.useMemo(() => {
    if (tokenPrizeData && tokenPrizeData.total_prize !== undefined && tokenPrizeData.total_prize !== null) {
      const formatted = formatTokenPrize(tokenPrizeData.total_prize, tokenPrizeData.token_address, connectedNativeSymbol)
      const lastSpaceIndex = formatted.lastIndexOf(" ")
      if (lastSpaceIndex !== -1) {
        const amount = formatted.slice(0, lastSpaceIndex)
        const symbol = formatted.slice(lastSpaceIndex + 1)
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
    const symbol = getTokenSymbol(null, connectedNativeSymbol)
    return (
      <>
        {formatNumber(getPrizeTotal(competition))}{" "}
        <span className="text-[10px] font-medium text-teal-700">
          {symbol}
        </span>
      </>
    )
  }, [tokenPrizeData, competition, connectedNativeSymbol])

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

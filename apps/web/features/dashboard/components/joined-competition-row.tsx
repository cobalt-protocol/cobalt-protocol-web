import {
  ArrowRight,
  Blocks,
  Eye,
  Users,
  UserPlus,
  Wallet,
  Zap,
} from "lucide-react"
import { useAccount } from "wagmi"
import type { DashboardCompetition, DashboardPhase } from "../types"
import { phaseBadges } from "../lib/dashboard-selectors"
import { formatMoney } from "@/lib/format"
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
  const rawTxHash = competition.txHash || competition.tx_hash || "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  const txHash = rawTxHash.startsWith("0x") ? rawTxHash : `0x${rawTxHash}`
  const explorerBaseUrl = (chain?.blockExplorers?.default?.url || "https://scan.bohr.life").replace(/\/$/, "")
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
            className="hover:underline hover:text-primary transition-colors"
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
          className={`mt-1 text-xl font-extrabold tracking-tight ${competition.phase === "claim" ? "text-teal-800" : ""}`}
        >
          {formatMoney(competition.amountUsd)} {competition.currency}
        </p>
        <button
          onClick={onAction}
          className={`mt-1 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${styles.button}`}
        >
          {competition.phase === "claim" && <ActionIcon size={16} />}
          {competition.actionLabel}
          {competition.phase !== "claim" && <ActionIcon size={16} />}
        </button>
      </div>
    </article>
  )
}

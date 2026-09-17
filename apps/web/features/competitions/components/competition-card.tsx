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
import { Badge, primaryLinkClass } from "@/components/ui/page-primitives"
import { formatMoney, formatNumber } from "@/lib/format"
import { routes } from "@/lib/routes"
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
  referenceDate: string
}) {
  const Icon = icons[competition.icon]
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
              competition.registrationEndsAt,
              referenceDate
            )}{" "}
            days left
          </span>
        </div>
        <h3 className="mt-2 text-lg leading-snug font-extrabold tracking-tight">
          {competition.title}
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
              {formatMoney(getPrizeTotal(competition))}{" "}
              <span className="text-[10px] font-medium text-teal-700">
                {competition.currency}
              </span>
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
          href={routes.competition(competition.slug)}
          className={primaryLinkClass + " w-full"}
        >
          View Details <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  )
}

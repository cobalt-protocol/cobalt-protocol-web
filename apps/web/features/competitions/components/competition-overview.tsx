import { Badge, Panel, primaryLinkClass } from "@/components/ui/page-primitives"
import { formatMoney, formatNumber } from "@/lib/format"
import { routes } from "@/lib/routes"
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
              href={routes.workspace(competition.slug)}
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
          {formatMoney(getPrizeTotal(competition))}{" "}
          <span className="text-sm font-medium text-muted-foreground">
            {competition.currency}
          </span>
        </p>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Pre-funded prize pool design for Arbitrum One. Escrow funding and
          payout verification will appear here once the wallet integration is
          available.
        </p>
        <div className="mt-5 rounded-lg bg-white p-4">
          <div className="flex justify-between gap-3 text-xs">
            <span>Prize allocation</span>
            <strong>{formatMoney(getPrizeTotal(competition))}</strong>
          </div>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full">
            {competition.prizes.map((prize, index) => (
              <span
                key={prize.id}
                style={{
                  width: `${(prize.amount / getPrizeTotal(competition)) * 100}%`,
                }}
                className={index % 2 === 0 ? "bg-primary" : "bg-teal-500"}
              />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {competition.prizes.length} award categories · sample data
          </p>
        </div>
      </div>
    </Panel>
  )
}

import { ArrowRight, RefreshCw, Sparkles, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import type { TeamListing } from "../types"

interface TeamCardProps {
  team: TeamListing
  capacity: number
  disabled: boolean
  onRequest: () => void
  onDiscard?: () => void
  onRefresh?: () => void
}
export function TeamCard({
  team,
  capacity,
  disabled,
  onRequest,
  onDiscard,
  onRefresh,
}: TeamCardProps) {
  const remaining = Math.max(0, capacity - team.memberCount)
  return (
    <article
      className={`flex flex-col rounded-2xl border bg-white p-5 md:p-6 ${onDiscard ? "border-teal-700/25" : "border-border/40"}`}
    >
      {onDiscard && (
        <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${team.matchScore >= 98 ? "bg-teal-700 text-white" : "bg-indigo-100 text-slate-600"}`}
          >
            <Sparkles size={12} />
            {team.matchScore}% Match Synergy
          </span>
          <div className="flex items-center gap-2 text-muted-foreground">
            <button
              type="button"
              onClick={onRefresh}
              aria-label={`Refresh recommendation for ${team.name}`}
              className="rounded p-2 hover:bg-blue-50"
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="inline-flex items-center gap-1 text-xs"
            >
              <X size={12} />
              Discard
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-start gap-3">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-primary"
          aria-hidden="true"
        >
          {team.name[0]}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold">{team.name}</h3>
          <p className="mt-1 text-xs font-semibold">{team.lead}</p>
          {remaining === 1 && (
            <span className="mt-1 inline-block rounded bg-red-100 px-2 text-[10px] font-bold text-red-600">
              1 SPOT LEFT
            </span>
          )}
        </div>
        <div className="w-36 rounded-xl bg-[#eff3ff] p-3">
          <p className="text-[10px] font-bold">
            Roster {team.memberCount} / {capacity} members
          </p>
          <progress
            aria-label={`${team.name} roster`}
            max={capacity}
            value={Math.min(team.memberCount, capacity)}
            className={`mt-1 h-1.5 w-full ${remaining <= 1 ? "accent-red-500" : "accent-primary"}`}
          />
          <p
            className={`mt-1 text-[10px] ${remaining <= 1 ? "text-red-600" : "text-muted-foreground"}`}
          >
            {remaining === 1
              ? "Final spot open"
              : `${remaining} spots remaining`}
          </p>
        </div>
      </div>
      <p className="my-6 flex-1 text-sm leading-6 text-muted-foreground">
        {team.description}
      </p>
      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border/40 pt-4">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground">
            LOOKING FOR:
          </span>
          {team.roles.map((role) => (
            <span
              key={role}
              className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-primary"
            >
              {role}
            </span>
          ))}
        </div>
        <Button
          disabled={disabled || remaining === 0}
          onClick={onRequest}
          className="shrink-0"
        >
          {remaining === 0 ? "Team Full" : "Send Request"}
          <ArrowRight size={14} />
        </Button>
      </div>
    </article>
  )
}

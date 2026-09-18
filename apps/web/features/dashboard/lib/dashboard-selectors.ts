import type { Competition } from "@/features/competitions/types"
import { getPrizeTotal } from "@/features/competitions/lib/competition-selectors"
import type { PreviewMembership } from "@/features/registration/types"
import {
  dashboardPhases,
  type DashboardCompetition,
  type DashboardFilter,
  type DashboardPhase,
} from "../types"
export const phaseLabels: Record<DashboardPhase, string> = {
  registration: "Registration",
  submission: "Submission",
  judging: "Judging",
  announcement: "Announcement",
  claim: "Claim the Prize",
  closed: "Closed",
}
export const phaseBadges: Record<DashboardPhase, string> = {
  registration: "Phase 1 - Registration",
  submission: "Phase 2 - Submission",
  judging: "Phase 3 - Judging",
  announcement: "Phase 4 - Announcement",
  claim: "Phase 5 - Claim the Prize",
  closed: "Closed",
}
export function mergeDashboardCompetitions(
  fixtures: readonly DashboardCompetition[],
  memberships: readonly PreviewMembership[],
  competitions: readonly Competition[]
): DashboardCompetition[] {
  const entries = fixtures.map((entry) => ({ ...entry }))
  for (const membership of memberships) {
    const competition = competitions.find(
      (item) => item.slug === membership.competitionSlug
    )
    if (!competition) continue
    const index = entries.findIndex(
      (item) => item.competitionSlug === membership.competitionSlug
    )
    const local: DashboardCompetition = {
      id: `local-${membership.competitionSlug}`,
      competitionSlug: membership.competitionSlug,
      title: competition.title,
      category: competition.tag,
      phase: "registration",
      organizer: competition.organizer,
      teamName: membership.teamName,
      memberCount: membership.role === "lead" ? 1 : null,
      amountUsd: getPrizeTotal(competition),
      currency: competition.currency,
      poolLabel: "Contract Escrow Pool",
      actionLabel:
        membership.status === "pending" ? "View Competition" : "Open Workspace",
      source: "local",
      pending: membership.status === "pending",
    }
    if (index >= 0) entries[index] = local
    else entries.push(local)
  }
  return entries
}
export function filterDashboardCompetitions(
  entries: readonly DashboardCompetition[],
  phase: DashboardFilter,
  query: string
): DashboardCompetition[] {
  const search = query.trim().toLowerCase()
  return entries.filter(
    (entry) =>
      (phase === "all" || entry.phase === phase) &&
      [entry.title, entry.category, entry.organizer, entry.teamName]
        .join(" ")
        .toLowerCase()
        .includes(search)
  )
}
export function getDashboardCounts(
  entries: readonly DashboardCompetition[]
): Record<DashboardFilter, number> {
  const counts: Record<DashboardFilter, number> = {
    all: entries.length,
    registration: 0,
    submission: 0,
    judging: 0,
    announcement: 0,
    claim: 0,
    closed: 0,
  }
  for (const phase of dashboardPhases)
    counts[phase] = entries.filter((entry) => entry.phase === phase).length
  return counts
}
export function getDashboardStats(entries: readonly DashboardCompetition[]) {
  return {
    active: entries.filter(
      (entry) => entry.phase !== "closed" && !entry.pending
    ).length,
    claimableUsd: entries
      .filter((entry) => entry.phase === "claim")
      .reduce((sum, entry) => sum + entry.amountUsd, 0),
  }
}

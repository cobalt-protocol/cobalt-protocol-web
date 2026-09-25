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
      (item) =>
        item.slug === membership.competitionSlug ||
        item.id === membership.competitionId
    )
    const rawComp = membership.rawTeam?.competition

    if (!competition && !rawComp) continue

    const title =
      competition?.title || rawComp?.name || membership.teamName || "Untitled Competition"
    const category = competition?.tag || rawComp?.category || "Hackathon"
    const competitionSlug =
      competition?.slug || rawComp?.slug || membership.competitionSlug
    const txHash = competition?.txHash || rawComp?.tx_hash || null

    let phase: DashboardPhase = "registration"
    if (rawComp) {
      const now = new Date()
      const compWin = rawComp.competition_window ? new Date(rawComp.competition_window) : null
      const subDead = rawComp.submission_deadline ? new Date(rawComp.submission_deadline) : null
      const judgRev = rawComp.judging_review ? new Date(rawComp.judging_review) : null
      const resAnn = rawComp.result_announcement ? new Date(rawComp.result_announcement) : null
      const claimDate = rawComp.pirze_certificate_claim ? new Date(rawComp.pirze_certificate_claim) : null

      if (compWin && now < compWin) phase = "registration"
      else if (subDead && now < subDead) phase = "submission"
      else if (judgRev && now < judgRev) phase = "judging"
      else if (resAnn && now < resAnn) phase = "announcement"
      else if (claimDate && now < claimDate) phase = "claim"
      else if (claimDate && now >= claimDate) phase = "closed"
    } else if (competition) {
      if (competition.status === "completed") phase = "closed"
    }

    const memberCount =
      membership.rawTeam?.team_roles?.length ?? (membership.role === "lead" ? 1 : null)

    const local: DashboardCompetition = {
      id: membership.teamId || `local-${membership.competitionSlug}`,
      txHash,
      tx_hash: txHash,
      competitionSlug,
      title,
      category,
      phase,
      organizer: competition?.organizer || "Cobalt Protocol",
      teamName: membership.teamName,
      memberCount,
      amountUsd: competition ? getPrizeTotal(competition) : 0,
      currency: competition?.currency || "USDC",
      poolLabel: "Contract Escrow Pool",
      actionLabel:
        membership.status === "pending" ? "View Competition" : "Open Workspace",
      source: "local",
      pending: membership.status === "pending",
    }

    const index = entries.findIndex(
      (item) => item.competitionSlug === competitionSlug || item.id === local.id
    )
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

import type { Competition } from "@/features/competitions/types"
import { getPrizeTotal } from "@/features/competitions/lib/competition-selectors"
import { TOKENS } from "@/lib/tokens"
import type { PreviewMembership } from "@/features/registration/types"
import type { ApiUserDashboardData } from "@/lib/competitions-api"
import {
  formatTokenPrize,
  type ApiTokenPrizeData,
} from "@/lib/competitions-api"
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
export function formatTokenPrizeLabel(
  tokenPrize?: ApiTokenPrizeData | null
): string | null {
  if (!tokenPrize) return null
  return formatTokenPrize(
    tokenPrize.total_prize,
    tokenPrize.token_address,
    undefined,
    18,
    tokenPrize.symbol || tokenPrize.token_symbol || undefined
  )
}
export function mergeDashboardCompetitions(
  fixtures: readonly DashboardCompetition[],
  memberships: readonly PreviewMembership[],
  competitions: readonly Competition[],
  dashboardData?: ApiUserDashboardData | null
): DashboardCompetition[] {
  const entries: DashboardCompetition[] = fixtures.map((entry) => ({
    ...entry,
  }))

  function resolveComp(slugOrId?: string | null) {
    if (!slugOrId) return undefined
    return competitions.find(
      (item) => item.slug === slugOrId || item.id === slugOrId
    )
  }

  function findExistingIndex(
    local: DashboardCompetition,
    teamId?: string | null
  ): number {
    return entries.findIndex((item) => {
      if (item.id === local.id) return true

      if (teamId && (item.id === teamId || item.id === `pending-${teamId}`)) {
        return true
      }

      if (
        local.competitionId &&
        item.competitionId &&
        local.competitionId === item.competitionId
      ) {
        return true
      }

      if (
        local.competitionSlug &&
        item.competitionSlug &&
        local.competitionSlug === item.competitionSlug
      ) {
        return true
      }

      return false
    })
  }

  if (dashboardData) {
    for (const m of dashboardData.memberships || []) {
      const competition =
        resolveComp(m.competition.slug) || resolveComp(m.competition.id)
      const competitionId = competition?.id || m.competition.id || null
      const competitionSlug =
        m.competition.slug || competition?.slug || m.competition.id || null
      const title =
        m.competition.title ||
        competition?.title ||
        m.teamName ||
        "Untitled Competition"
      const category = m.competition.category || competition?.tag || "Hackathon"

      let phase: DashboardPhase = "registration"
      const now = new Date()
      const subDead = m.competition.submissionDeadline
        ? new Date(m.competition.submissionDeadline)
        : null
      if (subDead && now >= subDead) {
        phase = "closed"
      } else if (competition?.status === "completed") {
        phase = "closed"
      }

      const local: DashboardCompetition = {
        id: m.teamId,
        competitionId,
        txHash: competition?.txHash || null,
        tx_hash: competition?.txHash || null,
        competitionSlug,
        title,
        category,
        phase,
        organizer: competition?.organizer || "Cobalt Protocol",
        teamName: m.teamName,
        memberCount: m.memberCount,
        amountUsd: competition ? getPrizeTotal(competition) : 0,
        currency: competition?.currency || TOKENS.USDT.symbol,
        poolLabel: "Contract Escrow Pool",
        actionLabel: "Open Workspace",
        source: "local",
        pending: false,
        role: m.role ?? "member",
      }

      const index = findExistingIndex(local, m.teamId)
      if (index >= 0) entries[index] = local
      else entries.push(local)
    }

    for (const req of dashboardData.pendingRequests || []) {
      const competition =
        resolveComp(req.competitionSlug) || resolveComp(req.competitionId)
      const competitionId = competition?.id || req.competitionId || null
      const competitionSlug =
        req.competitionSlug || competition?.slug || req.competitionId || null
      const title =
        req.competitionTitle || competition?.title || "Untitled Competition"

      const local: DashboardCompetition = {
        id: `pending-${req.requestId}`,
        competitionId,
        txHash: competition?.txHash || null,
        tx_hash: competition?.txHash || null,
        competitionSlug,
        title,
        category: competition?.tag || "Hackathon",
        phase: "registration",
        organizer: competition?.organizer || "Cobalt Protocol",
        teamName: req.teamName,
        memberCount: null,
        amountUsd: competition ? getPrizeTotal(competition) : 0,
        currency: competition?.currency || TOKENS.USDT.symbol,
        poolLabel: "Contract Escrow Pool",
        actionLabel: "View Competition",
        source: "local",
        pending: true,
        role: "member",
      }

      const index = findExistingIndex(local, req.teamId)
      if (index >= 0) entries[index] = local
      else entries.push(local)
    }
  }

  for (const membership of memberships) {
    const competition =
      resolveComp(membership.competitionSlug) ||
      resolveComp(membership.competitionId)
    const rawComp = membership.rawTeam?.competition

    if (!competition && !rawComp) continue

    const competitionId =
      competition?.id || rawComp?.id || membership.competitionId || null
    const title =
      competition?.title ||
      rawComp?.name ||
      membership.teamName ||
      "Untitled Competition"
    const category = competition?.tag || rawComp?.category || "Hackathon"
    const competitionSlug =
      competition?.slug || rawComp?.slug || membership.competitionSlug || null
    const txHash = competition?.txHash || rawComp?.tx_hash || null

    let phase: DashboardPhase = "registration"
    if (rawComp) {
      const now = new Date()
      const compWin = rawComp.competition_window
        ? new Date(rawComp.competition_window)
        : null
      const subDead = rawComp.submission_deadline
        ? new Date(rawComp.submission_deadline)
        : null
      const judgRev = rawComp.judging_review
        ? new Date(rawComp.judging_review)
        : null
      const resAnn = rawComp.result_announcement
        ? new Date(rawComp.result_announcement)
        : null
      const claimDate = rawComp.pirze_certificate_claim
        ? new Date(rawComp.pirze_certificate_claim)
        : null

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
      membership.rawTeam?.team_roles?.length ??
      (membership.role === "lead" ? 1 : null)

    const tokenPrize = formatTokenPrizeLabel(membership.rawTeam?.token_prize)

    const local: DashboardCompetition = {
      id: membership.teamId || `local-${membership.competitionSlug}`,
      competitionId,
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
      currency: competition?.currency || TOKENS.USDT.symbol,
      tokenPrizeFormatted: tokenPrize,
      poolLabel: "Contract Escrow Pool",
      actionLabel:
        membership.status === "pending" ? "View Competition" : "Open Workspace",
      source: "local",
      pending: membership.status === "pending",
      role: membership.role,
    }

    const index = findExistingIndex(local, membership.teamId)
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

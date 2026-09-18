export const dashboardPhases = [
  "registration",
  "submission",
  "judging",
  "announcement",
  "claim",
  "closed",
] as const
export type DashboardPhase = (typeof dashboardPhases)[number]
export type DashboardFilter = "all" | DashboardPhase
export interface DashboardCompetition {
  id: string
  competitionSlug: string | null
  title: string
  category: string
  phase: DashboardPhase
  organizer: string
  teamName: string
  memberCount: number | null
  amountUsd: number
  currency: string
  poolLabel: string
  actionLabel: string
  source: "fixture" | "local"
  pending?: boolean
}
export interface DashboardProfile {
  name: string
  username: string
  institution: string
  skills: readonly string[]
  pitch: string
  vaultAddress: string
  network: string
  firstPlaceFinishes: number
}

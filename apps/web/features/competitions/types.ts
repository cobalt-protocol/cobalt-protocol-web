export const competitionCategories = [
  "Hackathon",
  "AI & ML",
  "Design & UX",
  "Cyber Security",
] as const
export type CompetitionCategory = (typeof competitionCategories)[number]
export type CompetitionStatus =
  "registration-open" | "closing-soon" | "completed"
export type CompetitionIcon = "bot" | "landmark" | "leaf" | "shield" | "palette"
export interface Prize {
  id: string
  title: string
  amount: number
  description: string
}
export interface TimelineStage {
  id: string
  title: string
  description: string
  dateLabel: string
  status: "active" | "upcoming" | "locked"
}
export interface JudgingCriterion {
  id: string
  title: string
  description: string
  weight: number
}
export interface Competition {
  id: string
  slug: string
  txHash?: string | null
  tx_hash?: string | null
  title: string
  organizer: string
  organizerDescription: string
  category: CompetitionCategory
  tag: string
  icon: CompetitionIcon
  status: CompetitionStatus
  description: string
  requirement?: string
  registrationEndsAt: string
  startsAt: string
  endsAt: string
  participants: number
  teamCount: number
  maxTeamSize: number
  currency: "USDC"
  prizes: readonly Prize[]
  timeline: readonly TimelineStage[]
  judgingCriteria: readonly JudgingCriterion[]
  rules: readonly string[]
  guidebookUrl: string | null
}
export type CompetitionSort =
  "prize-desc" | "deadline-asc" | "participants-desc"
export type DeadlineFilter = "any" | "week" | "month"
export interface CompetitionFilters {
  query: string
  categories: readonly CompetitionCategory[]
  deadline: DeadlineFilter
  sort: CompetitionSort
}

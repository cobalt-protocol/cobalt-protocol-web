import type { Competition, CompetitionFilters } from "../types"
export const getPrizeTotal = (competition: Competition): number =>
  competition.prizes.reduce((sum, prize) => sum + prize.amount, 0)
export function getDaysRemaining(
  deadline: string,
  referenceDate: string
): number {
  return Math.max(
    0,
    Math.ceil((Date.parse(deadline) - Date.parse(referenceDate)) / 86_400_000)
  )
}
export function selectCompetitions(
  competitions: readonly Competition[],
  filters: CompetitionFilters,
  referenceDate: string
): Competition[] {
  const query = filters.query.trim().toLowerCase()
  return competitions
    .filter((competition) => {
      const matchesQuery = [
        competition.title,
        competition.organizer,
        competition.tag,
        competition.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
      const matchesCategory =
        filters.categories.length === 0 ||
        filters.categories.includes(competition.category)
      const days = getDaysRemaining(
        competition.registrationEndsAt,
        referenceDate
      )
      const matchesDeadline =
        filters.deadline === "any" ||
        (competition.status !== "completed" &&
          days <= (filters.deadline === "week" ? 7 : 30))
      return matchesQuery && matchesCategory && matchesDeadline
    })
    .sort((a, b) => {
      if (filters.sort === "deadline-asc")
        return (
          Date.parse(a.registrationEndsAt) - Date.parse(b.registrationEndsAt)
        )
      if (filters.sort === "participants-desc")
        return b.participants - a.participants
      return getPrizeTotal(b) - getPrizeTotal(a)
    })
}

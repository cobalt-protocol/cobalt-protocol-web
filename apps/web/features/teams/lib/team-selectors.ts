import type { TeamListing } from "../types"

export const teamsPerPage = 6
export function searchTeams(
  teams: readonly TeamListing[],
  query: string
): TeamListing[] {
  const normalized = query.trim().toLowerCase()
  return teams.filter((team) =>
    [team.name, team.lead, team.description, ...team.roles]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  )
}
export function recommendTeams(
  teams: readonly TeamListing[],
  excluded: readonly string[],
  offset: number
): TeamListing[] {
  const available = teams
    .filter((team) => !excluded.includes(team.id))
    .sort((a, b) => b.matchScore - a.matchScore)
  if (!available.length) return []
  const start = offset % available.length
  const rotated = [...available.slice(start), ...available.slice(0, start)]
  const leads = new Set<string>()
  return rotated
    .filter((team) => {
      if (leads.has(team.lead)) return false
      leads.add(team.lead)
      return true
    })
    .slice(0, 4)
}

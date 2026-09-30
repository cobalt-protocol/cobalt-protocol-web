import type { Competition } from "../types"
import {
  fetchCompetitions,
  fetchCompetitionById,
  fetchTeamCompetitionDetail,
  mapApiCompetitionToCompetition,
} from "@/lib/competitions-api"

export async function getCompetitions(): Promise<readonly Competition[]> {
  return fetchCompetitions()
}

export async function getCompetitionById(
  id: string
): Promise<Competition | undefined> {
  // 1. Direct fetch from NestJS API endpoint GET /api/v1/competitions/:id
  const directComp = await fetchCompetitionById(id)
  if (directComp) {
    return directComp
  }

  // 2. Direct fetch competition by Team ID from GET /api/v1/teams/:teamId/competition
  const teamComp = await fetchTeamCompetitionDetail(id)
  if (teamComp?.competition) {
    return mapApiCompetitionToCompetition(teamComp.competition)
  }

  // 3. Fallback: Search in overall competitions list (by ID or slug)
  const competitions = await getCompetitions()
  const exactMatch = competitions.find(
    (competition) => competition.id === id || competition.slug === id
  )
  if (exactMatch) return exactMatch

  // 4. Fallback exact case-insensitive match
  const idLower = id.toLowerCase()
  return competitions.find((c) => c.slug.toLowerCase() === idLower)
}

export async function getCompetitionBySlug(
  slug: string
): Promise<Competition | undefined> {
  return getCompetitionById(slug)
}

export async function getFeaturedCompetitions(): Promise<readonly Competition[]> {
  const competitions = await getCompetitions()
  return competitions.slice(0, 3)
}




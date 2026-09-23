import type { Competition } from "../types"
import { mockCompetitions } from "./competitions"
import { fetchCompetitions } from "@/lib/competitions-api"

export async function getCompetitions(): Promise<readonly Competition[]> {
  return fetchCompetitions()
}

export async function getCompetitionBySlug(
  slug: string
): Promise<Competition | undefined> {
  const competitions = await getCompetitions()
  return competitions.find(
    (competition) => competition.slug === slug || competition.id === slug
  )
}

export async function getFeaturedCompetitions(): Promise<readonly Competition[]> {
  const competitions = await getCompetitions()
  return competitions.slice(0, 3)
}


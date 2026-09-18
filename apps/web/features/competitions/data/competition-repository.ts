import type { Competition } from "../types"
import { mockCompetitions } from "./competitions"

export function getCompetitions(): readonly Competition[] {
  return mockCompetitions
}
export function getCompetitionBySlug(slug: string): Competition | undefined {
  return mockCompetitions.find((competition) => competition.slug === slug)
}
export function getFeaturedCompetitions(): readonly Competition[] {
  return mockCompetitions.slice(0, 3)
}

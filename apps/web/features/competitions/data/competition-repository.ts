import { mockCompetitions } from "./competitions"
import type { Competition } from "../types"

// Replace this read boundary with API calls when the backend is available.
export function getCompetitions(): readonly Competition[] {
  return mockCompetitions
}
export function getCompetitionBySlug(slug: string): Competition | undefined {
  return mockCompetitions.find((competition) => competition.slug === slug)
}
export function getFeaturedCompetitions(): readonly Competition[] {
  return mockCompetitions.slice(0, 3)
}

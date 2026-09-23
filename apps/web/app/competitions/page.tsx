import type { Metadata } from "next"
import { CompetitionDirectory } from "@/features/competitions/components/competition-directory"
import { fetchPublicCompetitions } from "@/features/competitions/data/public-competition-api"
export const metadata: Metadata = {
  title: "Discover Competitions | Cobalt Protocol",
}
export default async function CompetitionsPage() {
  const competitions = await fetchPublicCompetitions()
  return (
    <CompetitionDirectory
      competitions={competitions}
      referenceDate={new Date().toISOString()}
    />
  )
}

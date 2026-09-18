import type { Metadata } from "next"
import { CompetitionDirectory } from "@/features/competitions/components/competition-directory"
import { getCompetitions } from "@/features/competitions/data/competition-repository"
import { competitionPreviewDate } from "@/features/competitions/data/competitions"
export const metadata: Metadata = {
  title: "Discover Competitions | Cobalt Protocol",
}
export default function CompetitionsPage() {
  return (
    <CompetitionDirectory
      competitions={getCompetitions()}
      referenceDate={competitionPreviewDate}
    />
  )
}

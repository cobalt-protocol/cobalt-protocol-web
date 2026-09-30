import type { Metadata } from "next"
import { CompetitionDirectory } from "@/features/competitions/components/competition-directory"

export const metadata: Metadata = {
  title: "Discover Competitions | Cobalt Protocol",
}

export default function CompetitionsPage() {
  return (
    <CompetitionDirectory />
  )
}

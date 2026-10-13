import { ProfilePage } from "@/features/profile/components/profile-page"
import type { Metadata } from "next"
import { getCompetitionById } from "@/features/competitions/data/competition-repository"

export const metadata: Metadata = { title: "Builder Profile | Cobalt Protocol" }
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; setup?: string }>
}) {
  const { competition: competitionId, setup } = await searchParams
  const competition =
    typeof competitionId === "string" ? await getCompetitionById(competitionId) : undefined
  return (
    <ProfilePage resumeCompetition={competition} startEditing={setup === "1"} />
  )
}

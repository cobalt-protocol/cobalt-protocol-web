import { NotFoundUI } from "@/components/ui/not-found-ui"
import type { Metadata } from "next"
import { getCompetitionById } from "@/features/competitions/data/competition-repository"
import { JoinTeamPage } from "@/features/teams/components/join-team-page"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const competition = await getCompetitionById(id)
  return {
    title: competition
      ? `Join a Team · ${competition.title} | Cobalt Protocol`
      : "Competition not found",
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const competition = await getCompetitionById(id)
  if (!competition) return <NotFoundUI />
  return <JoinTeamPage competition={competition} />
}


import { redirect } from "next/navigation"
import { getCompetitionById } from "@/features/competitions/data/competition-repository"
import { CompetitionWorkspace } from "@/features/workspace/components/competition-workspace"
import {
  fetchTeamCompetitionDetailResult,
  mapApiCompetitionToCompetition,
} from "@/lib/competitions-api"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"
export const dynamicParams = true

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const competition = await getCompetitionById(slug)

  if (!competition) {
    return {
      title: "Workspace | Cobalt Protocol",
    }
  }

  return {
    title: `My Competition · ${competition.title} | Cobalt Protocol`,
  }
}

export default async function MyCompetitionPage({ params }: PageProps) {
  const { slug } = await params

  const teamCompResult = await fetchTeamCompetitionDetailResult(slug)

  let teamId: string | undefined = slug
  let competition = teamCompResult.data?.competition
    ? mapApiCompetitionToCompetition(teamCompResult.data.competition)
    : undefined

  if (teamCompResult.data?.team?.id) {
    teamId = teamCompResult.data.team.id
  }

  if (!competition) {
    competition = await getCompetitionById(slug)
  }

  const targetCompId = competition?.id || competition?.slug || slug

  if (
    teamCompResult.status === 404 ||
    teamCompResult.status === 401 ||
    teamCompResult.status === 403 ||
    !teamCompResult.data
  ) {
    redirect(`/competition/${encodeURIComponent(targetCompId)}`)
  }

  return (
    <CompetitionWorkspace
      key={teamId || slug}
      competition={competition}
      teamId={teamId || slug}
    />
  )
}


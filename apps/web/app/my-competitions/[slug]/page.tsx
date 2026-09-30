import { getCompetitionById } from "@/features/competitions/data/competition-repository"
import { CompetitionWorkspace } from "@/features/workspace/components/competition-workspace"
import {
  fetchTeamCompetitionDetail,
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
  let competition = await getCompetitionById(slug)
  let teamId: string | undefined = slug

  if (!competition) {
    const teamComp = await fetchTeamCompetitionDetail(slug)
    if (teamComp?.competition) {
      teamId = teamComp.team.id
      competition = mapApiCompetitionToCompetition(teamComp.competition)
    }
  }

  return (
    <CompetitionWorkspace
      key={teamId || slug}
      competition={competition}
      teamId={teamId || slug}
    />
  )
}


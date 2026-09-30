"use client"

import { useEffect } from "react"
import { useSiteActions } from "@/components/layout/site-actions"
import { useQuery } from "@tanstack/react-query"
import { notFound, useRouter } from "next/navigation"
import {
  fetchTeamCompetitionDetailResult,
  mapApiCompetitionToCompetition,
} from "@/lib/competitions-api"
import { Breadcrumbs, PageContainer, Panel } from "@/components/ui/page-primitives"
import { CompetitionOverview } from "@/features/competitions/components/competition-overview"
import { CompetitionTimeline } from "@/features/competitions/components/competition-timeline"
import type { Competition } from "@/features/competitions/types"
import { routes } from "@/lib/routes"
import { SubmissionForm } from "./submission-form"
import { RegisteredTeam } from "./registered-team"
import { WorkspaceAnnouncements } from "./workspace-announcements"

export function CompetitionWorkspace({
  competition: initialCompetition,
  teamId,
}: {
  competition?: Competition
  teamId?: string
}) {
  const router = useRouter()
  const { connected } = useSiteActions()

  const { data: teamCompResult, isFetched, isLoading } = useQuery({
    queryKey: ["team-competition", teamId],
    queryFn: () => (teamId ? fetchTeamCompetitionDetailResult(teamId) : null),
    enabled: Boolean(teamId),
  })

  useEffect(() => {
    const targetCompId = initialCompetition?.id || initialCompetition?.slug || teamId
    if (targetCompId) {
      if (!connected) {
        router.push(routes.competition(targetCompId))
      } else if (
        isFetched &&
        (teamCompResult?.status === 404 ||
          teamCompResult?.status === 401 ||
          teamCompResult?.status === 403 ||
          !teamCompResult?.data)
      ) {
        router.push(routes.competition(targetCompId))
      }
    }
  }, [connected, isFetched, teamCompResult, teamId, initialCompetition, router])

  const fetchedComp = teamCompResult?.data?.competition
    ? mapApiCompetitionToCompetition(teamCompResult.data.competition)
    : null

  const competition = fetchedComp || initialCompetition

  if (isLoading && !competition) {
    return (
      <PageContainer>
        <Panel>
          <p role="status" className="text-sm text-slate-500">
            Loading competition workspace...
          </p>
        </Panel>
      </PageContainer>
    )
  }

  if (isFetched && !competition) {
    notFound()
  }

  if (!competition) {
    notFound()
  }

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Competitions", href: routes.competitions },
          {
            label: competition.title,
            href: routes.competition(competition.id),
          },
          { label: "My Competition" },
        ]}
      />
      <div className="space-y-5">
        <CompetitionOverview competition={competition} workspace />
        <CompetitionTimeline stages={competition.timeline} />
        <RegisteredTeam
          competitionSlug={competition.slug}
          capacity={competition.maxTeamSize}
          formation={competition.formation}
          teamId={teamId}
        />
        <SubmissionForm competitionId={competition.id} />
        <WorkspaceAnnouncements />
      </div>
    </PageContainer>
  )
}

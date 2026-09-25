"use client"

import { useQuery } from "@tanstack/react-query"
import { notFound } from "next/navigation"
import {
  fetchTeamCompetitionDetail,
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
  const { data: teamComp, isFetched, isLoading } = useQuery({
    queryKey: ["team-competition", teamId],
    queryFn: () => (teamId ? fetchTeamCompetitionDetail(teamId) : null),
    enabled: Boolean(teamId),
  })

  const fetchedComp = teamComp?.competition
    ? mapApiCompetitionToCompetition(teamComp.competition)
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
      <p className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        Participant workspace · Team roster & metadata are synchronized with the backend API.
      </p>
      <div className="space-y-5">
        <CompetitionOverview competition={competition} workspace />
        <CompetitionTimeline stages={competition.timeline} />
        <RegisteredTeam
          competitionSlug={competition.slug}
          capacity={competition.maxTeamSize}
          teamId={teamId}
        />
        <SubmissionForm competitionId={competition.id} />
        <WorkspaceAnnouncements />
      </div>
    </PageContainer>
  )
}

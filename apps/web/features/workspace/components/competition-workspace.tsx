import { Breadcrumbs, PageContainer } from "@/components/ui/page-primitives"
import { CompetitionOverview } from "@/features/competitions/components/competition-overview"
import { CompetitionTimeline } from "@/features/competitions/components/competition-timeline"
import type { Competition } from "@/features/competitions/types"
import { routes } from "@/lib/routes"
import { SubmissionForm } from "./submission-form"
import { TeamManagement } from "./team-management"
import { WorkspaceAnnouncements } from "./workspace-announcements"

export function CompetitionWorkspace({
  competition,
}: {
  competition: Competition
}) {
  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Competitions", href: routes.competitions },
          {
            label: competition.title,
            href: routes.competition(competition.slug),
          },
          { label: "My Competition" },
        ]}
      />
      <p className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        Participant workspace preview · team changes last for this visit. Draft
        text can be saved in this browser. No wallet or competition registration
        is required for this preview.
      </p>
      <div className="space-y-5">
        <CompetitionOverview competition={competition} workspace />
        <CompetitionTimeline stages={competition.timeline} />
        <TeamManagement capacity={competition.maxTeamSize} />
        <SubmissionForm competitionId={competition.id} />
        <WorkspaceAnnouncements />
      </div>
    </PageContainer>
  )
}

import { OrganizerCompetitionDetail } from "@/features/organizer/components/competition-detail"

interface CompetitionDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CompetitionDetailPage({
  params,
}: CompetitionDetailPageProps) {
  const { id } = await params
  return <OrganizerCompetitionDetail id={id} />
}

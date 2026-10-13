import { NotFoundUI } from "@/components/ui/not-found-ui"
import type { Metadata } from "next"
import { getCompetitionById } from "@/features/competitions/data/competition-repository"
import { CompetitionDetail } from "@/features/competitions/components/competition-detail"

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
      ? `${competition.title} | Cobalt Protocol`
      : "Competition not found",
  }
}

export default async function CompetitionPage({ params }: PageProps) {
  const { id } = await params
  const competition = await getCompetitionById(id)
  
  if (!competition) {
    return <NotFoundUI />
  }

  return (
    <CompetitionDetail
      competition={competition}
      id={id}
      slug={competition.slug}
      viewMode="user"
    />
  )
}



import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { fetchPublicCompetitionBySlug } from "@/features/competitions/data/public-competition-api"
import { CompetitionDetail } from "@/features/competitions/components/competition-detail"
interface PageProps {
  params: Promise<{ slug: string }>
}
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const competition = await fetchPublicCompetitionBySlug(slug)
  return {
    title: competition
      ? `${competition.title} | Cobalt Protocol`
      : "Competition not found",
  }
}
export default async function CompetitionPage({ params }: PageProps) {
  const { slug } = await params
  const competition = await fetchPublicCompetitionBySlug(slug)
  if (!competition) notFound()
  return <CompetitionDetail competition={competition} />
}

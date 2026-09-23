import { CompetitionDetail } from "@/features/competitions/components/competition-detail"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
interface PageProps {
  params: Promise<{ slug: string }>
}
export async function generateStaticParams() {
  const competitions = await getCompetitions()
  return competitions.map(({ slug }) => ({ slug }))
}
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const competition = await getCompetitionBySlug(slug)
  return {
    title: competition
      ? `${competition.title} | Cobalt Protocol`
      : "Competition not found",
  }
}
export default async function CompetitionPage({ params }: PageProps) {
  const { slug } = await params
  const competition = await getCompetitionBySlug(slug)
  if (!competition) notFound()
  return <CompetitionDetail competition={competition} />
}

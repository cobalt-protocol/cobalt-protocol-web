import {
  getCompetitionBySlug,
  getCompetitions,
} from "@/features/competitions/data/competition-repository"
import { CompetitionWorkspace } from "@/features/workspace/components/competition-workspace"
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
      ? `My Competition · ${competition.title} | Cobalt Protocol`
      : "Competition not found",
  }
}
export default async function MyCompetitionPage({ params }: PageProps) {
  const { slug } = await params
  const competition = await getCompetitionBySlug(slug)
  if (!competition) notFound()
  return <CompetitionWorkspace key={competition.id} competition={competition} />
}

import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  getCompetitionById,
  getCompetitions,
} from "@/features/competitions/data/competition-repository"
import { CompetitionDetail } from "@/features/competitions/components/competition-detail"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const competitions = await getCompetitions()
  return competitions.flatMap(({ id, slug }) => [
    { id: slug },
    ...(id !== slug ? [{ id }] : []),
  ])
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
  if (!competition) notFound()
  return <CompetitionDetail competition={competition} id={id} slug={competition.slug} viewMode="user" />
}

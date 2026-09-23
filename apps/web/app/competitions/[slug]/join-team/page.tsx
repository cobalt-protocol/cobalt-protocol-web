import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  getCompetitionBySlug,
  getCompetitions,
} from "@/features/competitions/data/competition-repository"
import { JoinTeamPage } from "@/features/teams/components/join-team-page"

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
  const competition = await getCompetitionBySlug((await params).slug)
  return {
    title: competition
      ? `Join a Team · ${competition.title} | Cobalt Protocol`
      : "Competition not found",
  }
}
export default async function Page({ params }: PageProps) {
  const competition = await getCompetitionBySlug((await params).slug)
  if (!competition) notFound()
  return <JoinTeamPage competition={competition} />
}

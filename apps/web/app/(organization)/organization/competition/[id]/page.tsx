import type { Metadata } from "next"
import { getCompetitionById } from "@/features/competitions/data/competition-repository"
import { CompetitionDetail } from "@/features/competitions/components/competition-detail"

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
            : "Organization Competition Detail | Cobalt Protocol",
    }
}

export default async function OrganizationCompetitionPage({ params }: PageProps) {
    const { id } = await params
    const competition = await getCompetitionById(id)

    return <CompetitionDetail competition={competition} id={id} viewMode="organization" />
}

import { CompetitionWorkspace } from "@/features/workspace/components/competition-workspace"
import {
  fetchTeamCompetitionDetailResult,
  mapApiCompetitionToCompetition,
} from "@/lib/competitions-api"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"
export const dynamicParams = true

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const teamCompResult = await fetchTeamCompetitionDetailResult(slug)
  const title = teamCompResult.data?.competition?.name

  if (!title) {
    return {
      title: "Workspace | Cobalt Protocol",
    }
  }

  return {
    title: `My Competition · ${title} | Cobalt Protocol`,
  }
}

export default async function MyCompetitionPage({ params }: PageProps) {
  const { slug } = await params

  // PENTING: token sesi disimpan di localStorage (client-only) lewat
  // getStoredToken(), sehingga Server Component ini TIDAK punya akses token.
  // Kalau kita fetch ber-auth + redirect di server, request dianggap anonim:
  //   - GET /teams/:teamId/competition  -> OptionalAuthSessionGuard (userId undefined)
  //     -> getCompetitionByTeamId menghitung isMember = false
  //     -> team private melempar NotFoundException (404)
  //   - GET /teams/:teamId/members      -> AuthSessionGuard -> 401
  // Akibatnya leader (team_role.role = "lead") pun ikut ter-redirect ke
  // /competition. Jadi server hanya melakukan prefetch "best effort" untuk data
  // awal (berguna untuk team public), tanpa pernah memutuskan redirect.
  //
  // Keputusan redirect dilakukan di CompetitionWorkspace (client) yang punya
  // token dari localStorage:
  //   - wallet belum connect  -> /competition (lewat useAccount)
  //   - 401/403/404 (tanpa akses data) -> /competition
  const teamCompResult = await fetchTeamCompetitionDetailResult(slug)
  const teamId = teamCompResult.data?.team?.id || slug
  const competition = teamCompResult.data?.competition
    ? mapApiCompetitionToCompetition(teamCompResult.data.competition)
    : undefined

  return (
    <CompetitionWorkspace
      key={teamId}
      competition={competition}
      teamId={teamId}
    />
  )
}

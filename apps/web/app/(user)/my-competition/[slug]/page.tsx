import { CompetitionWorkspace } from "@/features/workspace/components/competition-workspace"
import {
  DEFAULT_CHAIN_ID,
  fetchMyTeamsResult,
  mapApiCompetitionToCompetition,
} from "@/lib/competitions-api"
import type { Metadata } from "next"

/**
 * ABI sync: apps/web/abi/CompetitionManager.json
 * - safeMintCertificateParticipant(uint256 _competitionId, uint256 _teamId, bytes _signature, string _cid)
 *   _cid = raw CID (tanpa ipfs://), on-chain di-wrap via IPFSHelper.toIPFSURI(_cid).
 *   Signature diverifikasi on-chain sebagai:
 *   keccak256(abi.encodePacked(address(this), msg.sender, _competitionId, _teamId, _cid))
 *   → harus 1:1 dengan API hashParticipantCertificate().
 *   PENTING: _cid yang dikirim ke contract HARUS berasal dari signature response
 *   `fetchParticipantCertificateSignature(...)-> data.cid | data.certificate_cid | data.uri` (strip ipfs://),
 *   BUKAN dari `competition.certificate_cid`. Jika pakai certificate_cid display, signature recovery gagal (ECDSAInvalidSignature).
 *
 * - safeMintCertificateParticipantWinner(uint256 _winnerId, bytes signature, string _cid)
 *   verifikasi: keccak256(abi.encodePacked(address(this), msg.sender, _winnerId, uri))
 *   uri = ipfs:// + _cid (IPFSHelper.toIPFSURI). _cid juga dari fetchWinnerCertificateSignature.
 *
 * Helper ABIs (CertificateHelper.json, IPFSHelper.json, FormationHelper.json) kini kosong []
 * karena library internal — frontend hanya pakai CompetitionManager.json untuk mint.
 * page.tsx ini tetap Server Component: hanya prefetch best-effort + pass
 * competition.onchainCompetitionId (competition_id numerik) & teamId ke
 * CompetitionWorkspace -> WorkspaceAnnouncements (client) yang handle wagmi
 * writeContract dengan chainId aktif (useChainId) + fetchParticipantCertificateSignature(chainId, competitionId, teamId).
 * `competition.certificate_cid` hanya untuk display di WorkspaceAnnouncements, tidak untuk args mint.
 */

export const dynamic = "force-dynamic"
export const dynamicParams = true

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  // Sumber data diganti dari api/v1/users/me/dashboard -> GET /chains/:chainId/teams
  // TeamController @Controller('chains/:chainId/teams') + @Get() @UseGuards(AuthSessionGuard)
  // Response sudah include `competition` via relasi Team.competition_id -> Competition.id
  // (Prisma `include: { competition: true }`), jadi judul bisa diambil dari team.competition.name
  // Server Component tidak punya akses wagmi `chainId` & token (localStorage),
  // jadi pakai DEFAULT_CHAIN_ID (968 / BotChain Testnet) untuk SSR best-effort tanpa auth.
  // Client (`CompetitionWorkspace`) akan re-fetch dengan `useChainId()` + Bearer token yang benar.
  try {
    const teamsResult = await fetchMyTeamsResult(DEFAULT_CHAIN_ID)
    const team = teamsResult.data?.find((t) => t.id === slug)
    const title = team?.competition?.name
    if (!title) {
      return { title: "Workspace | Cobalt Protocol" }
    }
    return { title: `My Competition · ${title} | Cobalt Protocol` }
  } catch {
    return { title: "Workspace | Cobalt Protocol" }
  }
}

export default async function MyCompetitionPage({ params }: PageProps) {
  const { slug } = await params

  // PENTING: token sesi disimpan di localStorage (client-only) lewat
  // getStoredToken(), sehingga Server Component ini TIDAK punya akses token.
  // GET /chains/:chainId/teams adalah endpoint protected (@UseGuards(AuthSessionGuard)):
  //   team_role.user_id = JWT sub (request.userId), filter chainId via competition.indexer_state_id,
  //   include: { competition: true, skills_team, requirements_team, team_codes, team_roles->user, request_joins, submission_project }
  // Tanpa token -> 401, jadi server hanya melakukan prefetch "best effort" (akan fallback ke slug).
  // ChainId wajib di path (controller `chains/:chainId/teams`), jadi server
  // memakai DEFAULT_CHAIN_ID; client akan revalidate dengan chainId aktif + token.
  //
  // Keputusan redirect dilakukan di CompetitionWorkspace (client) yang punya
  // token dari localStorage + chainId dari wagmi `useChainId()`:
  //   - wallet belum connect  -> /competition (lewat useAccount)
  //   - 401/403/404 (tanpa akses data) -> /competition
  let teamId = slug
  let competition: ReturnType<typeof mapApiCompetitionToCompetition> | undefined = undefined
  try {
    const teamsResult = await fetchMyTeamsResult(DEFAULT_CHAIN_ID)
    const team = teamsResult.data?.find((t) => t.id === slug)
    if (team) {
      teamId = team.id
      if (team.competition) {
        competition = mapApiCompetitionToCompetition(team.competition)
      }
    }
  } catch {
    // best-effort SSR tanpa token -> fallback ke slug, client akan re-fetch ber-auth
  }

  return (
    <CompetitionWorkspace
      key={teamId}
      competition={competition}
      teamId={teamId}
    />
  )
}


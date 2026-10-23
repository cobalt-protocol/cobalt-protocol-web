import { formatUnits } from "viem"
import type {
  Competition,
  CompetitionCategory,
} from "@/features/competitions/types"
import { TOKENS, getTokenSymbol, getTokenByAddress } from "./tokens"

export { TOKENS, getTokenSymbol, getTokenByAddress }

export interface ApiCompetitionWinner {
  id: string
  competition_id: string
  team_id?: string | null
  user_id?: string | null
  winner_id?: string | null
  category?: string | null
  amount?: number | string | null
  prize_amount?: number | string | null
  percentage?: number | string | null
  place?: number | null
  rank?: number | null
  tx_hash?: string | null
  certificate_cid?: string | null
  created_at?: string
}

export interface ApiPrizeDeposit {
  id: string
  tx_hash: string
  treasury_prize_id: string
  competition_id: string
  token_address: string
  sender: string
  amount: string
  indexer_state_id?: string | null
  created_at: string
  updated_at?: string | null
  deleted_at?: string | null
}

export interface ApiCompetition {
  id: string
  competition_id?: string | null
  slug?: string | null
  tx_hash?: string | null
  name: string
  category: string
  description: string
  requirement: string
  formation?: string
  max_team_size?: number
  registration_window: string
  competition_window: string
  submission_deadline: string
  judging_review: string
  result_announcement: string
  pirze_certificate_claim: string
  certificate_cid?: string | null
  guidebook_cid?: string | null
  fee?: string | number | null
  fee_token_address?: string | null
  created_at: string
  prize_winners?: ApiCompetitionWinner[]
  prize_deposits?: ApiPrizeDeposit[]
  total?: number | null
  token?: string | null
  user_id?: string | null
  total_teams?: number | null
  total_participant?: number | null
  teams?: any[]
}

export interface ApiCompetitionsResponse {
  data: ApiCompetition[]
  message: string
  errors: null | any
}

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
const API_BASE_URL = rawApiUrl.endsWith("/api/v1")
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/$/, "")}/api/v1`

export const DEFAULT_CHAIN_ID = 968
export function getDefaultChainId(): number { return DEFAULT_CHAIN_ID }
export function resolveChainId(chainId?: number | null): number {
  if (typeof chainId === "number" && Number.isInteger(chainId) && chainId > 0) return chainId
  return DEFAULT_CHAIN_ID
}

export type ParticipantCertificateSignatureData = {
  signature?: string | null
  cid?: string | null
  certificate_cid?: string | null
  uri?: string | null
  metadata?: {
    title_project: string
    description_project: string | null
    submission_link: string
    document_cid: string
    document_uri: string | null
    title: string
    description: string
    image: string
    certificate_cid: string
  } | null
  id?: string
  team_id?: string
  competition_id?: string
  user_id?: string
}

export async function fetchMyParticipantMinted(
  teamId: string,
  tokenMaybe?: string | null
): Promise<any> {
  if (!teamId) throw new Error("teamId is required to fetch participant minted certificates")
  const authToken = tokenMaybe || getStoredToken()
  if (!authToken) {
    throw new Error("You must be authenticated.")
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/me/certificates/team/${encodeURIComponent(teamId)}/participant-minted`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`,
      },
    })
    
    if (response.status === 404) {
       return { data: null }
    }
    
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.message || `Failed to fetch participant minted certificates (${response.status})`)
    }
    return payload
  } catch (error: any) {
    console.error("fetchMyParticipantMinted error:", error)
    throw error
  }
}

export async function fetchParticipantCertificateSignature(
  chainIdOrCompetitionId: number | string,
  competitionIdOrTeamId?: string,
  teamIdOrToken?: string | null,
  tokenMaybe?: string | null,
): Promise<{ data?: ParticipantCertificateSignatureData | null; message?: string }> {
  let chainId: number
  let competitionId: string
  let teamId: string
  let token: string | null | undefined
  if (typeof chainIdOrCompetitionId === "number") {
    chainId = resolveChainId(chainIdOrCompetitionId)
    competitionId = competitionIdOrTeamId as string
    teamId = teamIdOrToken as string
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    competitionId = chainIdOrCompetitionId as string
    teamId = competitionIdOrTeamId as string
    token = teamIdOrToken as string | null
  }
  if (!teamId) throw new Error("teamId is required to fetch participant certificate signature")
  const authToken = token || getStoredToken()
  if (!authToken) {
    throw new Error("You must be authenticated to mint a participant certificate.")
  }

  const response = await fetch(
    `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(competitionId)}/signature-certificate-participant/${encodeURIComponent(teamId)}`,
    {
      method: "GET",
      headers: {
        Authorization: authToken.startsWith("Bearer ")
          ? authToken
          : `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  )

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload?.message ||
      (typeof payload?.errors === "string" ? payload.errors : null) ||
      `Failed to fetch participant certificate signature (${response.status})`
    const err: any = new Error(message)
    err.status = response.status
    err.payload = payload
    throw err
  }

  return payload
}

export async function fetchWinnerCertificateSignature(
  chainIdOrCompetitionId: number | string,
  competitionIdOrWinnerId?: string | null,
  winnerIdOrToken?: string | null,
  tokenMaybe?: string | null,
): Promise<{ data?: { signature?: string | null; winner_id?: string | null; uri?: string | null }; message?: string }> {
  let chainId: number
  let competitionId: string
  let winnerId: string | null | undefined
  let token: string | null | undefined
  if (typeof chainIdOrCompetitionId === "number") {
    chainId = resolveChainId(chainIdOrCompetitionId)
    competitionId = competitionIdOrWinnerId as string
    if (typeof winnerIdOrToken === "string" && (winnerIdOrToken?.startsWith("Bearer ") || winnerIdOrToken?.length > 40) && tokenMaybe === undefined) {
      winnerId = undefined
      token = winnerIdOrToken
    } else {
      winnerId = winnerIdOrToken as string | null | undefined
      token = tokenMaybe
    }
  } else {
    chainId = DEFAULT_CHAIN_ID
    competitionId = chainIdOrCompetitionId as string
    winnerId = competitionIdOrWinnerId as string | null | undefined
    token = winnerIdOrToken as string | null | undefined
  }
  const authToken = token || getStoredToken()
  if (!authToken) {
    throw new Error("You must be authenticated to mint a winner certificate.")
  }
  const path = winnerId
    ? `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(competitionId)}/signature-certificate-winner/${encodeURIComponent(winnerId)}`
    : `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(competitionId)}/signature-certificate-winner`
  const response = await fetch(path, {
    method: "GET",
    headers: {
      Authorization: authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.message || `Failed to fetch winner certificate signature (${response.status})`)
  }
  return payload
}

export async function fetchSetWinnerSignature(
  chainIdOrCompetitionId: number | string,
  competitionIdOrWinnerId?: string | null,
  winnerIdOrTeamId?: string | null,
  teamIdOrToken?: string | null,
  tokenMaybe?: string | null,
): Promise<{ data?: { signature?: string | null; winner_id?: string | null; participant?: string | null; competition_id?: string | number | null; competition_onchain_id?: string | number | null; team_id?: string | null; numeric_team_id?: string | null; contract_address?: string | null; chain_id?: number | null; hash?: string | null }; message?: string }> {
  let chainId: number
  let competitionId: string
  let winnerId: string | null | undefined
  let teamId: string | null | undefined
  let token: string | null | undefined

  if (typeof chainIdOrCompetitionId === "number") {
    chainId = resolveChainId(chainIdOrCompetitionId)
    competitionId = competitionIdOrWinnerId as string
    winnerId = winnerIdOrTeamId as string | null | undefined
    teamId = teamIdOrToken as string | null | undefined
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    competitionId = chainIdOrCompetitionId as string
    winnerId = competitionIdOrWinnerId as string | null | undefined
    teamId = winnerIdOrTeamId as string | null | undefined
    token = teamIdOrToken as string | null | undefined
  }

  const authToken = token || getStoredToken()
  if (!authToken) {
    throw new Error("You must be authenticated to set a winner.")
  }

  const path = `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(competitionId)}/signature-set-winner`
  const response = await fetch(path, {
    method: "POST",
    headers: {
      Authorization: authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      winner_id: winnerId,
      team_id: teamId,
    }),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload?.message ||
      (typeof payload?.errors === "string" ? payload.errors : null) ||
      `Failed to fetch set winner signature (${response.status})`
    const err: any = new Error(message)
    err.status = response.status
    err.payload = payload
    throw err
  }

  return payload
}

export function parse18DecimalAmount(
  val?: string | number | null,
  decimals: number = 18
): number {
  if (val === undefined || val === null || val === "") return 0
  const strVal = val.toString().trim()
  try {
    const bigVal = BigInt(strVal)
    const threshold = decimals <= 6 ? 1_000_000n : 1_000_000_000n
    if (bigVal >= threshold) {
      const formatted = formatUnits(bigVal, decimals)
      const parsed = parseFloat(formatted)
      return isNaN(parsed) ? 0 : parsed
    } else {
      const parsed = Number(strVal)
      return isNaN(parsed) ? 0 : parsed
    }
  } catch {
    const parsed = parseFloat(strVal)
    return isNaN(parsed) ? 0 : parsed
  }
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0] || "th"
}

export function parseCapacityFromFormation(
  formation?: string,
  fallback: number = 5
): number {
  if (!formation) return fallback
  const trimmed = formation.trim()
  if (/solo/i.test(trimmed)) return 1

  const rangeMatch = trimmed.match(/(\d+)\s*(?:–|—|-|to)\s*(\d+)/i)
  if (rangeMatch && rangeMatch[2]) {
    const val = parseInt(rangeMatch[2], 10)
    if (!isNaN(val) && val > 0) return val
  }

  const singleMatch = trimmed.match(/(\d+)/)
  if (singleMatch && singleMatch[1]) {
    const val = parseInt(singleMatch[1], 10)
    if (!isNaN(val) && val > 0) return val
  }

  return fallback
}

export function mapApiCompetitionToCompetition(
  apiComp: ApiCompetition
): Competition {
  let category: CompetitionCategory = "Hackathon"
  const catLower = (apiComp.category || "").toLowerCase()
  if (catLower.includes("ai") || catLower.includes("ml")) {
    category = "AI & ML"
  } else if (catLower.includes("design") || catLower.includes("ux")) {
    category = "Design & UX"
  } else if (catLower.includes("sec") || catLower.includes("cyber")) {
    category = "Cyber Security"
  }

  const icon =
    category === "AI & ML"
      ? "bot"
      : category === "Cyber Security"
        ? "shield"
        : category === "Design & UX"
          ? "palette"
          : "landmark"

  const now = new Date()
  const regEnd = new Date(
    apiComp.registration_window || apiComp.submission_deadline || Date.now()
  )
  const subEnd = new Date(apiComp.submission_deadline || Date.now())
  let status: Competition["status"] = "registration-open"
  if (now > subEnd) {
    status = "completed"
  } else if (regEnd.getTime() - now.getTime() < 7 * 86400000 && regEnd > now) {
    status = "closing-soon"
  }

  const generatedSlug = apiComp.name
    ? apiComp.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    : apiComp.id
  const slug = generatedSlug || apiComp.id
  const ipfsGatewayUrl = (
    process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "http://localhost:8081/ipfs"
  ).replace(/\/$/, "")
  const guidebookUrl = apiComp.guidebook_cid
    ? apiComp.guidebook_cid.startsWith("http://") ||
      apiComp.guidebook_cid.startsWith("https://")
      ? apiComp.guidebook_cid
      : `${ipfsGatewayUrl}/${apiComp.guidebook_cid.replace(/^ipfs:\/\//, "")}`
    : null

  const prizes =
    apiComp.prize_winners && apiComp.prize_winners.length > 0
      ? apiComp.prize_winners.map((w, i) => {
          const placeNum = w.rank || w.place || i + 1
          const rawAmount = w.prize_amount ?? w.amount ?? 0
          const amountNum = parse18DecimalAmount(rawAmount, 18)
          const titleStr =
            w.category || `${placeNum}${getOrdinalSuffix(placeNum)} Place`
          return {
            id: w.id || `prize-${i}`,
            title: titleStr,
            amount: amountNum,
            rawAmount: String(rawAmount),
            description: w.tx_hash
              ? `Reward (${w.tx_hash.slice(0, 10)}...)`
              : "Prize reward",
          }
        })
      : []

  const fmtDate = (s?: string) =>
    s
      ? new Date(s).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "TBA"

  const formattedTxHash = apiComp.tx_hash || null

  const apiMaxTeamSize =
    (apiComp as any).max_team_size ?? (apiComp as any).maxTeamSize
  const computedMaxTeamSize = apiComp.formation
    ? parseCapacityFromFormation(apiComp.formation, apiMaxTeamSize ?? 5)
    : (apiMaxTeamSize ?? 5)

  // Prize Pool Capacity (dashboard rows) = prize_deposits[0].amount (single entry, raw token units) + token_address.
  // Competition directory "Prize vault" and detail "Total guaranteed prize" now both use the
  // on-chain treasuryPrizeByCompetitionId totalPrize directly (see competition-card / competition-overview).
  const prizeDeposits = (apiComp.prize_deposits || []).map((d) => ({
    token_address: d.token_address ?? null,
    amount: d.amount ?? null,
  }))
  const prizeDepositsTotalRaw = (() => {
    const first = prizeDeposits[0]
    if (!first) return null
    const raw = String(first.amount ?? "").trim()
    if (!raw || !/^\d+$/.test(raw)) return null
    try {
      const bi = BigInt(raw)
      return bi === 0n ? null : bi.toString()
    } catch {
      return null
    }
  })()

  // Derive the prize currency symbol from the on-chain token address instead of
  // hardcoding USDT. On-chain symbol resolution (useDynamicTokenInfo /
  // convertTokenOnChain) takes precedence at render time.
  const prizeCurrencyTokenAddress =
    prizeDeposits[0]?.token_address || apiComp.fee_token_address || null

  return {
    id: apiComp.id,
    onchainCompetitionId: apiComp.competition_id ?? null,
    slug,
    txHash: formattedTxHash,
    tx_hash: formattedTxHash,
    title: apiComp.name || "Untitled Competition",
    organizer: "Cobalt Protocol",
    organizerDescription:
      "Decentralized competition organizer on Cobalt Protocol.",
    category,
    tag: apiComp.category || category,
    icon,
    status,
    description: apiComp.description || "",
    requirement: apiComp.requirement || "",
    formation: apiComp.formation || `1–${computedMaxTeamSize} members`,
    registrationEndsAt: apiComp.registration_window || new Date().toISOString(),
    startsAt:
      apiComp.registration_window ||
      apiComp.competition_window ||
      new Date().toISOString(),
    endsAt:
      apiComp.pirze_certificate_claim ||
      apiComp.result_announcement ||
      apiComp.submission_deadline ||
      new Date().toISOString(),
    participants:
      typeof apiComp.total_participant === "number"
        ? apiComp.total_participant
        : 0,
    teamCount:
      typeof apiComp.total_teams === "number" ? apiComp.total_teams : 0,
    total_participant:
      typeof apiComp.total_participant === "number"
        ? apiComp.total_participant
        : 0,
    total_teams:
      typeof apiComp.total_teams === "number" ? apiComp.total_teams : 0,
    maxTeamSize: computedMaxTeamSize,
    currency: getTokenSymbol(prizeCurrencyTokenAddress),
    prizes,
    timeline: [
      {
        id: "registration",
        title: "Registration Window",
        description: "Register team and form squad before window closes",
        dateLabel: fmtDate(apiComp.registration_window),
        status:
          now < new Date(apiComp.registration_window) ? "active" : "upcoming",
      },
      {
        id: "competition",
        title: "Competition Window",
        description: "Build project solution and collaborate",
        dateLabel: fmtDate(apiComp.competition_window),
        status: "upcoming",
      },
      {
        id: "submission",
        title: "Submission Deadline",
        description: "Final solution and repository submission",
        dateLabel: fmtDate(apiComp.submission_deadline),
        status: "upcoming",
      },
      {
        id: "judging",
        title: "Judging Review",
        description: "Project evaluation and scoring",
        dateLabel: fmtDate(apiComp.judging_review),
        status: "locked",
      },
      {
        id: "announcement",
        title: "Results & Claim",
        description: "Winners announcement and prize payout",
        dateLabel: fmtDate(
          apiComp.result_announcement || apiComp.pirze_certificate_claim
        ),
        status: "locked",
      },
    ],
    judgingCriteria: [
      {
        id: "innovation",
        title: "Innovation & Impact",
        weight: 50,
        description: "Novelty & technical impact.",
      },
      {
        id: "execution",
        title: "Code Architecture",
        weight: 50,
        description: "System design quality.",
      },
    ],
    rules: apiComp.requirement
      ? [apiComp.requirement]
      : ["Follow Cobalt Protocol rules."],
    guidebookUrl,
    certificate_cid: apiComp.certificate_cid ?? null,
    pirze_certificate_claim: apiComp.pirze_certificate_claim ?? null,
    fee: apiComp.fee ?? null,
    fee_token_address: apiComp.fee_token_address ?? null,
    prizeDeposits,
    prizeDepositsTotalRaw,
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem("cobalt:access_token")
}

export interface CreateTeamPayload {
  name?: string
  visibility: boolean
  description: string
  skills_team?: string[]
}

function parseApiErrorResponse(resJson: any, fallbackMessage: string): string {
  const raw = resJson?.message || resJson?.error || fallbackMessage
  if (typeof raw === "string") return raw
  if (Array.isArray(raw))
    return raw
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
      .join(", ")
  if (typeof raw === "object") {
    if (typeof raw.message === "string") return raw.message
    try {
      return JSON.stringify(raw)
    } catch {
      return fallbackMessage
    }
  }
  return String(raw)
}

export async function createCompetitionTeam(
  chainIdOrCompetitionId: number | string,
  payloadOrCompetitionId?: CreateTeamPayload | string,
  tokenOrPayload?: string | CreateTeamPayload | null,
  tokenMaybe?: string | null
): Promise<{ data: any; message: string }> {
  let chainId: number
  let competitionIdOrSlug: string
  let payload: CreateTeamPayload
  let token: string | null | undefined
  if (typeof chainIdOrCompetitionId === "number") {
    chainId = resolveChainId(chainIdOrCompetitionId)
    competitionIdOrSlug = payloadOrCompetitionId as string
    payload = tokenOrPayload as CreateTeamPayload
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    competitionIdOrSlug = chainIdOrCompetitionId as string
    payload = payloadOrCompetitionId as CreateTeamPayload
    token = tokenOrPayload as string | null | undefined
  }
  const authToken = token || getStoredToken()
  if (!authToken) {
    throw new Error("You must be authenticated to create a team.")
  }

  const response = await fetch(
    `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(competitionIdOrSlug)}/join-teams`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    }
  )

  const resJson = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(parseApiErrorResponse(resJson, "Failed to create team"))
  }

  return resJson
}

export async function acceptTeamInviteByCode(
  chainIdOrCode: number | string,
  codeOrTeamId?: string,
  teamIdOrToken?: string | null,
  tokenMaybe?: string | null
): Promise<{ data: any; message: string }> {
  let chainId: number
  let codeOrInviteId: string
  let teamId: string
  let token: string | null | undefined
  if (typeof chainIdOrCode === "number") {
    chainId = resolveChainId(chainIdOrCode)
    codeOrInviteId = codeOrTeamId as string
    teamId = teamIdOrToken as string
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    codeOrInviteId = chainIdOrCode as string
    teamId = codeOrTeamId as string
    token = teamIdOrToken as string | null | undefined
  }
  if (!teamId) {
    throw new Error(
      "A team ID is required to accept a team invite. Please open the invite from the team's page."
    )
  }

  const authToken = token || getStoredToken()
  if (!authToken) {
    throw new Error(
      "You must be authenticated to accept a team invite. Please connect your wallet."
    )
  }

  const response = await fetch(
    `${API_BASE_URL}/chains/${chainId}/teams/${encodeURIComponent(teamId)}/invites/${encodeURIComponent(codeOrInviteId)}/accept`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    }
  )

  const resJson = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      parseApiErrorResponse(resJson, "Failed to join team via code")
    )
  }

  return resJson
}

export async function acceptTeamInvite(
  chainIdOrTeamId: number | string,
  teamIdOrInviteId?: string,
  inviteIdOrToken?: string | null,
  tokenMaybe?: string | null
): Promise<{ data: any; message: string }> {
  if (typeof chainIdOrTeamId === "number") {
    return acceptTeamInviteByCode(chainIdOrTeamId, teamIdOrInviteId as string, inviteIdOrToken as string, tokenMaybe)
  }
  return acceptTeamInviteByCode(chainIdOrTeamId as string, teamIdOrInviteId as string, inviteIdOrToken as string | null)
}

export async function requestJoinTeam(
  chainIdOrTeamId: number | string,
  teamIdOrToken?: string | null,
  tokenMaybe?: string | null
): Promise<{ data: any; message: string }> {
  let chainId: number
  let teamId: string
  let token: string | null | undefined
  if (typeof chainIdOrTeamId === "number") {
    chainId = resolveChainId(chainIdOrTeamId)
    teamId = teamIdOrToken as string
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    teamId = chainIdOrTeamId as string
    token = teamIdOrToken as string | null | undefined
  }
  const authToken = token || getStoredToken()
  if (!authToken) {
    throw new Error(
      "You must be authenticated to submit a join request. Please connect your wallet."
    )
  }

  const response = await fetch(
    `${API_BASE_URL}/chains/${chainId}/teams/${encodeURIComponent(teamId)}/request-join`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken.startsWith("Bearer ")
          ? authToken
          : `Bearer ${authToken}`,
      },
    }
  )

  const resJson = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      parseApiErrorResponse(resJson, "Failed to submit join request")
    )
  }

  return resJson
}

export interface JoinTeamByCodeResult {
  data: {
    team_id: string
    team_name?: string
    role?: ApiTeamRole | null
    max_team_size?: number
    member_count?: number
  } | null
  message: string
  errors: null | any
}

/**
 * POST /chains/:chainId/competitions/:competitionId/join-by-code
 * Join a team instantly using a team_code. Unlike the public directory flow,
 * this works for private teams that are not listed via join-teams — the backend
 * resolves the code to a team, validates it belongs to the competition, and
 * enforces capacity derived from `competition.formation`.
 */
export async function joinTeamByCode(
  chainIdOrCompetitionId: number | string,
  competitionIdOrCode?: string,
  codeOrToken?: string | null,
  tokenMaybe?: string | null
): Promise<JoinTeamByCodeResult> {
  let chainId: number
  let competitionId: string
  let code: string
  let token: string | null | undefined
  if (typeof chainIdOrCompetitionId === "number") {
    chainId = resolveChainId(chainIdOrCompetitionId)
    competitionId = competitionIdOrCode as string
    code = codeOrToken as string
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    competitionId = chainIdOrCompetitionId as string
    code = competitionIdOrCode as string
    token = codeOrToken as string | null | undefined
  }

  const authToken = token || getStoredToken()
  if (!authToken) {
    throw new Error(
      "You must be authenticated to join a team by code. Please connect your wallet."
    )
  }
  if (!competitionId) {
    throw new Error("A competition ID is required to join a team by code.")
  }
  if (!code || !code.trim()) {
    throw new Error("A team code is required to join a team.")
  }

  const response = await fetch(
    `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(competitionId)}/join-by-code`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken.startsWith("Bearer ")
          ? authToken
          : `Bearer ${authToken}`,
      },
      body: JSON.stringify({ team_code: code.trim() }),
    }
  )

  const resJson = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(parseApiErrorResponse(resJson, "Failed to join team by code"))
  }

  return resJson
}

export interface TeamJoinRequestsResponse {
  data: ApiRequestJoin[] | null
  status: number
}

/**
 * GET /teams/:teamId/requests
 * Returns the join requests received by a team. The API only allows the team
 * leader to read this list (403 for other members), so callers should treat
 * 401/403/404 as "no access" and hide the UI.
 */
export async function fetchTeamJoinRequestsResult(
  chainIdOrTeamId: number | string,
  teamIdOrToken?: string | null | boolean | Record<string, any>,
  tokenMaybe?: string | null
): Promise<TeamJoinRequestsResponse> {
  let chainId: number
  let teamId: string
  let token: string | null | boolean | Record<string, any> | undefined
  if (typeof chainIdOrTeamId === "number") {
    chainId = resolveChainId(chainIdOrTeamId)
    teamId = teamIdOrToken as string
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    teamId = chainIdOrTeamId as string
    token = teamIdOrToken as any
  }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const authToken =
      typeof token === "string"
        ? token
        : token === null || token === false
          ? null
          : getStoredToken()
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`
    }

    const res = await fetch(
      `${API_BASE_URL}/chains/${chainId}/teams/${encodeURIComponent(teamId)}/requests`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )

    if (!res.ok) {
      return { data: null, status: res.status }
    }

    const json = await res.json()
    if (!json) return { data: null, status: res.status }
    const payload = Array.isArray(json.data)
      ? json.data
      : Array.isArray(json)
        ? json
        : null
    return { data: payload, status: res.status }
  } catch {
    return { data: null, status: 500 }
  }
}

export async function fetchTeamJoinRequests(
  chainIdOrTeamId: number | string,
  teamIdOrToken?: string | null,
  tokenMaybe?: string | null
): Promise<ApiRequestJoin[] | null> {
  let chainId: number
  let teamId: string
  let token: string | null | undefined
  if (typeof chainIdOrTeamId === "number") {
    chainId = resolveChainId(chainIdOrTeamId)
    teamId = teamIdOrToken as string
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    teamId = chainIdOrTeamId as string
    token = teamIdOrToken as string | null | undefined
  }
  const result = await fetchTeamJoinRequestsResult(chainId, teamId, token)
  return result.data
}

async function updateTeamJoinRequest(
  chainIdOrTeamId: number | string,
  teamIdOrRequestId?: string,
  requestIdOrAction?: string,
  actionOrToken?: "accept" | "reject" | string | null,
  tokenMaybe?: string | null
): Promise<{ data: any; message: string }> {
  let chainId: number
  let teamId: string
  let requestId: string
  let action: "accept" | "reject"
  let token: string | null | undefined
  if (typeof chainIdOrTeamId === "number") {
    chainId = resolveChainId(chainIdOrTeamId)
    teamId = teamIdOrRequestId as string
    requestId = requestIdOrAction as string
    action = actionOrToken as "accept" | "reject"
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    teamId = chainIdOrTeamId as string
    requestId = teamIdOrRequestId as string
    action = requestIdOrAction as "accept" | "reject"
    token = actionOrToken as string | null | undefined
  }
  const authToken = token || getStoredToken()
  if (!authToken) {
    throw new Error(
      "You must be authenticated to manage join requests. Please connect your wallet."
    )
  }

  const response = await fetch(
    `${API_BASE_URL}/chains/${chainId}/teams/${encodeURIComponent(teamId)}/requests/${encodeURIComponent(requestId)}/${action}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken.startsWith("Bearer ")
          ? authToken
          : `Bearer ${authToken}`,
      },
    }
  )

  const resJson = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      parseApiErrorResponse(resJson, `Failed to ${action} join request`)
    )
  }

  return resJson
}

/** PATCH /chains/:chainId/teams/:teamId/requests/:requestId/accept (leader only). */
export async function acceptTeamJoinRequest(
  chainIdOrTeamId: number | string,
  teamIdOrRequestId?: string,
  requestIdOrToken?: string | null,
  tokenMaybe?: string | null
): Promise<{ data: any; message: string }> {
  if (typeof chainIdOrTeamId === "number") {
    return updateTeamJoinRequest(chainIdOrTeamId, teamIdOrRequestId as string, requestIdOrToken as string, "accept", tokenMaybe)
  }
  return updateTeamJoinRequest(chainIdOrTeamId as string, teamIdOrRequestId as string, "accept", requestIdOrToken as string | null)
}

/** PATCH /chains/:chainId/teams/:teamId/requests/:requestId/reject (leader only). */
export async function rejectTeamJoinRequest(
  chainIdOrTeamId: number | string,
  teamIdOrRequestId?: string,
  requestIdOrToken?: string | null,
  tokenMaybe?: string | null
): Promise<{ data: any; message: string }> {
  if (typeof chainIdOrTeamId === "number") {
    return updateTeamJoinRequest(chainIdOrTeamId, teamIdOrRequestId as string, requestIdOrToken as string, "reject", tokenMaybe)
  }
  return updateTeamJoinRequest(chainIdOrTeamId as string, teamIdOrRequestId as string, "reject", requestIdOrToken as string | null)
}

export interface ApiTeamRoleUser {
  id: string
  username?: string | null
  email?: string | null
  wallet_address?: string | null
  institution?: string | null
  location?: string | null
  skill_description?: {
    description?: string | null
  } | null
  social_media?: {
    github_link?: string | null
    linkedin_link?: string | null
  } | null
  skills?: Array<{ name?: string; skill_name?: string; level?: string }>
}

export interface ApiTeamRole {
  id: string
  team_id: string
  user_id: string
  role: string
  created_at?: string
  user?: ApiTeamRoleUser | null
}

export interface ApiTeamCode {
  id: string
  code: string
  team_id: string
  created_at?: string
}

export interface ApiTeamSkill {
  id: string
  name: string
  team_id: string
  created_at?: string
}

export interface ApiRequestJoin {
  id: string
  status: string
  user_id: string
  team_id: string
  created_at?: string
  updated_at?: string | null
  pitch?: string | null
  user?: ApiTeamRoleUser | null
}

export interface ApiSubmissionProject {
  id: string
  title: string
  description?: string | null
  submission_link: string
  document_cid: string
  team_id: string
  created_at: string
  updated_at?: string | null
  deleted_at?: string | null
}

export interface ApiTeam {
  id: string
  name: string
  visibility: boolean
  description?: string | null
  competition_id: string
  user_id: string
  status?: "pending" | "accepted"
  skills_team?: ApiTeamSkill[]
  team_codes?: ApiTeamCode[]
  team_roles?: ApiTeamRole[]
  request_joins?: ApiRequestJoin[]
  competition?: ApiCompetition
  token_prize?: ApiTokenPrizeData | null
  submission_project?: ApiSubmissionProject | null
  created_at: string
  updated_at?: string | null
}

export async function fetchTeamDetail(
  chainIdOrTeamId: number | string,
  teamIdOrToken?: string | null | boolean | Record<string, any>,
  tokenMaybe?: string | null
): Promise<any> {
  let chainId: number
  let teamId: string
  let token: string | null | boolean | Record<string, any> | undefined
  if (typeof chainIdOrTeamId === "number") {
    chainId = resolveChainId(chainIdOrTeamId)
    teamId = teamIdOrToken as string
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    teamId = chainIdOrTeamId as string
    token = teamIdOrToken as any
  }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const authToken =
      typeof token === "string"
        ? token
        : token === null || token === false
          ? null
          : getStoredToken()
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`
    }

    // UPDATED: ganti api/v1/chains/<chain_id>/teams/<id>/competition -> api/v1/chains/<chain_id>/competitions/<competition_id>
    // Step 1: fetch team dulu via GET /chains/:chainId/teams/:teamId
    const res = await fetch(
      `${API_BASE_URL}/chains/${chainId}/teams/${encodeURIComponent(teamId)}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )

    if (!res.ok) {
      // Fallback: jika teamId sebenarnya adalah competitionId, coba langsung hit competitions endpoint
      try {
        const compFallback = await fetch(
          `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(teamId)}`,
          { method: "GET", headers, cache: "no-store" }
        )
        if (compFallback.ok) {
          const cj = await compFallback.json()
          if (cj?.data) return { competition: cj.data, team_roles: [], team_codes: [] } as any
        }
      } catch {}
      return null
    }

    const json = await res.json()
    let teamData: any = null
    const rawData = json.data ?? json
    if (Array.isArray(rawData)) {
      // NEW: GET /chains/:chainId/teams/:teamId now returns TeamRole[] (list anggota)
      // Ambil team dari elemen pertama; team_roles disintesis dari array jika belum ada
      if (rawData.length === 0) return null
      const first: any = rawData[0]
      teamData = first?.team ? first.team : first
      // jika teamData belum punya team_roles lengkap, bangun dari array TeamRole
      if (!teamData.team_roles || teamData.team_roles.length === 0) {
        teamData.team_roles = rawData.map((r: any) => ({
          id: r.id,
          team_id: r.team_id,
          user_id: r.user_id,
          role: r.role,
          created_at: r.created_at,
          user: r.user,
        }))
      }
      // team_codes / other includes already on teamData via first.team include
    } else {
      teamData = rawData?.team ? rawData.team : rawData
    }
    if (!teamData) return null

    // Step 2: fetch competition via GET /chains/:chainId/competitions/:competitionId
    const competitionId = teamData.competition_id || teamData.competition?.id || teamData.competition?.competition_id
    if (competitionId) {
      try {
        const compRes = await fetch(
          `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(competitionId)}`,
          {
            method: "GET",
            headers,
            cache: "no-store",
          }
        )
        if (compRes.ok) {
          const compJson = await compRes.json()
          if (compJson?.data) {
            return {
              ...teamData,
              competition: compJson.data,
              team_roles: teamData.team_roles || [],
              team_codes: teamData.team_codes || [],
            }
          }
        }
      } catch {}
    }
    return teamData
  } catch {
    return null
  }
}
export interface TeamCompetitionDetailResponse {
  data: {
    competition: ApiCompetition
    team: ApiTeam
    team_roles: ApiTeamRole[]
    team_codes: ApiTeamCode[]
  } | null
  status: number
}

export async function fetchTeamCompetitionDetailResult(
  chainIdOrTeamId: number | string,
  teamIdOrToken?: string | null | boolean | Record<string, any>,
  tokenMaybe?: string | null
): Promise<TeamCompetitionDetailResponse> {
  let chainId: number
  let teamId: string
  let token: string | null | boolean | Record<string, any> | undefined
  if (typeof chainIdOrTeamId === "number") {
    chainId = resolveChainId(chainIdOrTeamId)
    teamId = teamIdOrToken as string
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    teamId = chainIdOrTeamId as string
    token = teamIdOrToken as any
  }
  if (!teamId) return { data: null, status: 404 }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const authToken =
      typeof token === "string"
        ? token
        : token === null || token === false
          ? null
          : getStoredToken()
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`
    }

    // UPDATED: migrasi dari GET /chains/:chainId/teams/:teamId/competition -> GET /chains/:chainId/competitions/:competitionId
    // Resolve competitionId via team -> competition, fallback anggap teamId sudah adalah competitionId (spec baru)
    let teamData: any = null
    let competitionIdForFetch: string | null = null
    try {
      const teamRes = await fetch(
        `${API_BASE_URL}/chains/${chainId}/teams/${encodeURIComponent(teamId)}`,
        { method: "GET", headers, cache: "no-store" }
      )
      if (teamRes.ok) {
        const tJson = await teamRes.json()
        const raw = tJson.data ?? tJson
        if (Array.isArray(raw)) {
          // NEW: response is TeamRole[] (list anggota), extract team from first element
          if (raw.length > 0) {
            const first: any = raw[0]
            teamData = first?.team ? first.team : first
            if (!teamData.team_roles || teamData.team_roles.length === 0) {
              teamData.team_roles = raw.map((r: any) => ({
                id: r.id,
                team_id: r.team_id,
                user_id: r.user_id,
                role: r.role,
                created_at: r.created_at,
                user: r.user,
              }))
            }
          }
        } else {
          teamData = raw?.team ? raw.team : raw
        }
        competitionIdForFetch =
          teamData?.competition_id ||
          teamData?.competition?.id ||
          teamData?.competition?.competition_id ||
          null
      }
    } catch {}
    if (!competitionIdForFetch) {
      try {
        const listRes = await fetch(`${API_BASE_URL}/chains/${chainId}/teams`, {
          method: "GET",
          headers,
          cache: "no-store",
        })
        if (listRes.ok) {
          const lJson = await listRes.json()
          const list: any[] = Array.isArray(lJson.data) ? lJson.data : []
          const normalized = list.map((x: any) => (x.team && x.team.id ? x.team : x))
          const found = normalized.find(
            (t: any) => t.id === teamId || t.competition_id === teamId
          )
          if (found) {
            teamData = found
            competitionIdForFetch =
              found.competition_id || found.competition?.id || null
          }
        }
      } catch {}
    }
    if (!competitionIdForFetch) competitionIdForFetch = teamId

    const res = await fetch(
      `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(competitionIdForFetch)}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )

    if (!res.ok) {
      return { data: null, status: res.status }
    }

    const json = await res.json()
    if (!json) return { data: null, status: res.status }
    const competition = json.data || null
    if (!competition) return { data: null, status: res.status }
    const payload = {
      competition,
      team: teamData || { id: teamId, competition_id: competitionIdForFetch },
      team_roles: teamData?.team_roles || [],
      team_codes: teamData?.team_codes || [],
    }
    return { data: payload as any, status: res.status }
  } catch {
    return { data: null, status: 500 }
  }
}

export async function fetchTeamCompetitionDetail(
  chainIdOrTeamId: number | string,
  teamIdOrToken?: string | null | boolean | Record<string, any>,
  tokenMaybe?: string | null
): Promise<{
  competition: ApiCompetition
  team: ApiTeam
  team_roles: ApiTeamRole[]
  team_codes: ApiTeamCode[]
} | null> {
  let chainId: number
  let teamId: string
  let token: string | null | boolean | Record<string, any> | undefined
  if (typeof chainIdOrTeamId === "number") {
    chainId = resolveChainId(chainIdOrTeamId)
    teamId = teamIdOrToken as string
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    teamId = chainIdOrTeamId as string
    token = teamIdOrToken as any
  }
  const result = await fetchTeamCompetitionDetailResult(chainId, teamId, token as string | null)
  return result.data
}

export interface TeamMembersResponse {
  data: ApiTeamRole[] | null
  status: number
}

export async function fetchTeamMembersResult(
  chainIdOrTeamId: number | string,
  teamIdOrToken?: string | null | boolean | Record<string, any>,
  tokenMaybe?: string | null
): Promise<TeamMembersResponse> {
  let chainId: number
  let teamId: string
  let token: string | null | boolean | Record<string, any> | undefined
  if (typeof chainIdOrTeamId === "number") {
    chainId = resolveChainId(chainIdOrTeamId)
    teamId = teamIdOrToken as string
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    teamId = chainIdOrTeamId as string
    token = teamIdOrToken as any
  }
  if (!teamId) return { data: null, status: 404 }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const authToken =
      typeof token === "string"
        ? token
        : token === null || token === false
          ? null
          : getStoredToken()
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`
    }

    const res = await fetch(
      `${API_BASE_URL}/chains/${chainId}/teams/${encodeURIComponent(teamId)}/members`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )

    if (!res.ok) {
      return { data: null, status: res.status }
    }

    const json = await res.json()
    if (!json) return { data: null, status: res.status }
    const payload = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : null
    return { data: payload, status: res.status }
  } catch {
    return { data: null, status: 500 }
  }
}

export async function fetchTeamMembers(
  chainIdOrTeamId: number | string,
  teamIdOrToken?: string | null | boolean | Record<string, any>,
  tokenMaybe?: string | null
): Promise<ApiTeamRole[] | null> {
  let chainId: number
  let teamId: string
  let token: string | null | boolean | Record<string, any> | undefined
  if (typeof chainIdOrTeamId === "number") {
    chainId = resolveChainId(chainIdOrTeamId)
    teamId = teamIdOrToken as string
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    teamId = chainIdOrTeamId as string
    token = teamIdOrToken as any
  }
  const result = await fetchTeamMembersResult(chainId, teamId, token as string | null)
  return result.data
}

export async function fetchMyTeamByCompetitionId(
  chainIdOrCompetitionId: number | string,
  competitionIdOrSlugOrToken?: string | null,
  tokenMaybe?: string | null
): Promise<ApiTeam | null> {
  let chainId: number
  let competitionIdOrSlug: string
  let token: string | null | undefined
  if (typeof chainIdOrCompetitionId === "number") {
    chainId = resolveChainId(chainIdOrCompetitionId)
    competitionIdOrSlug = competitionIdOrSlugOrToken as string
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    competitionIdOrSlug = chainIdOrCompetitionId as string
    token = competitionIdOrSlugOrToken as string | null | undefined
  }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const authToken = typeof token === "string" ? token : getStoredToken()
    if (!authToken) return null
    headers["Authorization"] = authToken.startsWith("Bearer ")
      ? authToken
      : `Bearer ${authToken}`

    const res = await fetch(
      `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(competitionIdOrSlug)}/my-team`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )

    if (!res.ok) return null
    const json = await res.json()
    return json.data || null
  } catch {
    return null
  }
}

export interface ApiUser {
  id: string
  wallet_address: string
  username?: string | null
  email?: string | null
  location?: string | null
  institution?: string | null
  role?: string
}

export async function fetchApiMe(
  token?: string | null
): Promise<ApiUser | null> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const authToken = typeof token === "string" ? token : getStoredToken()
    if (!authToken) return null
    headers["Authorization"] = authToken.startsWith("Bearer ")
      ? authToken
      : `Bearer ${authToken}`

    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (!res.ok) {
      return null
    }

    const json = await res.json()
    if (json?.data?.user) {
      return json.data.user
    }
    if (json?.data?.id) {
      return json.data
    }
    return null
  } catch {
    return null
  }
}

export async function fetchApiCompetitions(
  chainIdOrToken?: number | string | null | boolean | Record<string, any>,
  tokenMaybe?: string | null | boolean | Record<string, any>
): Promise<ApiCompetition[]> {
  let chainId: number
  let token: string | null | boolean | Record<string, any> | undefined
  if (typeof chainIdOrToken === "number") {
    chainId = resolveChainId(chainIdOrToken)
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    token = chainIdOrToken as any
  }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const authToken =
      typeof token === "string"
        ? token
        : token === null || token === false
          ? null
          : getStoredToken()
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`
    }

    const res = await fetch(`${API_BASE_URL}/chains/${chainId}/competitions`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (res.status === 404 || !res.ok) {
      return []
    }

    const json: ApiCompetitionsResponse = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

export async function fetchApiOrganizationCompetitions(
  chainIdOrToken?: number | string | null | boolean | Record<string, any>,
  tokenMaybe?: string | null | boolean | Record<string, any>
): Promise<ApiCompetition[]> {
  let chainId: number
  let token: string | null | boolean | Record<string, any> | undefined
  if (typeof chainIdOrToken === "number") {
    chainId = resolveChainId(chainIdOrToken)
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    token = chainIdOrToken as any
  }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const authToken =
      typeof token === "string"
        ? token
        : token === null || token === false
          ? null
          : getStoredToken()
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`
    }

    const res = await fetch(`${API_BASE_URL}/chains/${chainId}/competitions/organization`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (res.status === 404 || !res.ok) {
      return []
    }

    const json: ApiCompetitionsResponse = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

export async function fetchCompetitions(
  chainIdOrToken?: number | string | null | boolean | Record<string, any>,
  tokenMaybe?: string | null | boolean | Record<string, any>
): Promise<Competition[]> {
  let chainId: number
  let token: string | null | boolean | Record<string, any> | undefined
  if (typeof chainIdOrToken === "number") {
    chainId = resolveChainId(chainIdOrToken)
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    token = chainIdOrToken as any
  }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const authToken =
      typeof token === "string"
        ? token
        : token === null || token === false
          ? null
          : getStoredToken()
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`
    }

    const res = await fetch(`${API_BASE_URL}/chains/${chainId}/competitions`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (res.status === 404) {
      return []
    }

    if (!res.ok) return []

    const json: ApiCompetitionsResponse = await res.json()
    if (!json.data || !Array.isArray(json.data) || json.data.length === 0) {
      return []
    }

    const apiMapped = json.data.map(mapApiCompetitionToCompetition)
    return apiMapped
  } catch {
    return []
  }
}

export interface ApiSingleCompetitionResponse {
  data: ApiCompetition | null
  message: string
  errors: null | any
}

export interface ApiTokenPrizeData {
  competition_id: string
  onchain_competition_id: string
  token_address?: string | null
  symbol?: string | null
  token_symbol?: string | null
  total_prize?: string | number | null
  prize_deposits_count?: number
}

export interface ApiTokenPrizeResponse {
  data: ApiTokenPrizeData | null
  message: string
  errors: null | any
}

export interface ApiListingTokenPrize {
  id: string
  tx_hash?: string | null
  listing_token_prize_id: string
  token_address: string
  symbol?: string
  token_symbol?: string
  is_active: boolean
  created_at: string
  updated_at?: string | null
  deleted_at?: string | null
}

export interface ApiListingTokenPrizesResponse {
  data: ApiListingTokenPrize[] | null
  message: string
  errors: null | any
}

export function formatTokenPrize(
  totalPrize?: string | number | null,
  tokenAddress?: string | null,
  chainNativeSymbol?: string,
  decimals?: number,
  tokenObjSymbol?: string
): string {
  if (totalPrize === undefined || totalPrize === null || totalPrize === "") {
    return `0 ${getTokenSymbol(tokenAddress, chainNativeSymbol, tokenObjSymbol)}`
  }

  const token = getTokenByAddress(tokenAddress)
  const effectiveDecimals = decimals ?? token?.decimals ?? 18
  const symbol = getTokenSymbol(tokenAddress, chainNativeSymbol, tokenObjSymbol)
  const strVal = totalPrize.toString().trim()

  try {
    const bigVal = BigInt(strVal)
    const formattedStr = formatUnits(bigVal, effectiveDecimals)
    const numVal = parseFloat(formattedStr)
    if (!isNaN(numVal)) {
      return `${numVal.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${symbol}`
    }
    return `${formattedStr} ${symbol}`
  } catch {
    const numVal = parseFloat(strVal)
    if (!isNaN(numVal)) {
      return `${numVal.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${symbol}`
    }
  }

  return `${strVal} ${symbol}`
}

export async function fetchApiCompetitionById(
  chainIdOrId: number | string,
  idOrToken?: string | Record<string, any>,
  tokenMaybe?: string | Record<string, any>
): Promise<ApiCompetition | null> {
  let chainId: number
  let id: string
  let token: string | Record<string, any> | undefined
  if (typeof chainIdOrId === "number") { chainId = resolveChainId(chainIdOrId); id = idOrToken as string; token = tokenMaybe; } else { chainId = DEFAULT_CHAIN_ID; id = chainIdOrId as string; token = idOrToken as any; }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const authToken = typeof token === "string" ? token : getStoredToken()
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`
    }

    const res = await fetch(
      `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )

    if (res.ok) {
      const json: ApiSingleCompetitionResponse = await res.json()
      if (json.data) return json.data
    }

    // Jika API secara spesifik mengembalikan 404, jangan gunakan fallback ke list.
    // Jika endpoint /competitions/:id tidak ada/salah di backend, dia juga melempar 404,
    // dalam hal ini kita pastikan return null agar Page Not Found ter-trigger.
    return null
  } catch {
    return null
  }
}

export async function fetchTokenPrizeByCompetitionId(
  chainIdOrId: number | string,
  idOrToken?: string | null | boolean | Record<string, any>,
  tokenMaybe?: string | null | boolean | Record<string, any>
): Promise<ApiTokenPrizeData | null> {
  let chainId: number
  let id: string
  let token: string | null | boolean | Record<string, any> | undefined
  if (typeof chainIdOrId === "number") { chainId = resolveChainId(chainIdOrId); id = idOrToken as string; token = tokenMaybe; } else { chainId = DEFAULT_CHAIN_ID; id = chainIdOrId as string; token = idOrToken as any; }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const authToken =
      typeof token === "string"
        ? token
        : token === null || token === false
          ? null
          : getStoredToken()
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`
    }

    const res = await fetch(
      `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(id)}/token-prize`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )

    if (!res.ok) {
      return null
    }

    const json: ApiTokenPrizeResponse = await res.json()
    return json.data || null
  } catch {
    return null
  }
}

export async function fetchCompetitionById(
  chainIdOrId: number | string,
  idMaybe?: string
): Promise<Competition | null> {
  let chainId: number
  let id: string
  if (typeof chainIdOrId === "number") { chainId = resolveChainId(chainIdOrId); id = idMaybe as string; } else { chainId = DEFAULT_CHAIN_ID; id = chainIdOrId as string; }
  const apiData = await fetchApiCompetitionById(chainId, id)
  if (apiData) {
    return mapApiCompetitionToCompetition(apiData)
  }
  return null
}

export interface ApiPriceCompetition {
  id: string
  tx_hash?: string | null
  price_competition_fee_id: string
  treasury_fee: string
  token_address: string
  title: string
  description: string
  created_at: string
  updated_at?: string | null
  deleted_at?: string | null
  competitions?: any[]
}

export interface ApiPriceCompetitionResponse {
  data: ApiPriceCompetition
  message: string
  errors: null | any
}

export async function fetchPriceCompetitionById(
  chainIdOrId: number | string,
  idMaybe?: string
): Promise<ApiPriceCompetition | null> {
  let chainId: number
  let id: string
  if (typeof chainIdOrId === "number") { chainId = resolveChainId(chainIdOrId); id = idMaybe as string; } else { chainId = DEFAULT_CHAIN_ID; id = chainIdOrId as string; }
  try {
    const res = await fetch(
      `${API_BASE_URL}/chains/${chainId}/price-competitions/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    )

    if (!res.ok) {
      return null
    }

    const json: ApiPriceCompetitionResponse = await res.json()
    return json.data || null
  } catch {
    return null
  }
}

export async function fetchListingTokenPrizes(chainId?: number): Promise<
  ApiListingTokenPrize[]
> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/chains/${resolveChainId(chainId)}/competitions/listing-token-prize`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    )

    if (!res.ok) {
      return []
    }

    const json: ApiListingTokenPrizesResponse = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

export interface ApiUserDashboardMembership {
  teamId: string
  teamName: string
  visibility: "public" | "private"
  role: "lead" | "member"
  memberCount: number
  competition: {
    id: string
    slug: string
    title: string
    category: string
    registrationEndsAt: string
    submissionDeadline: string
  }
}

export interface ApiUserDashboardPendingRequest {
  requestId: string
  teamId: string
  teamName: string
  competitionId?: string
  competitionSlug: string
  competitionTitle: string
}

export interface ApiUserDashboardData {
  memberships: ApiUserDashboardMembership[]
  pendingRequests: ApiUserDashboardPendingRequest[]
}

export async function fetchUserDashboard(
  token?: string | null
): Promise<ApiUserDashboardData | null> {
  // Hard guard: /dashboard must NEVER hit legacy endpoint — uses GET /chains/:chainId/teams
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/dashboard")
  )
    return null
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    const authToken = typeof token === "string" ? token : getStoredToken()
    if (!authToken) return null
    headers["Authorization"] = authToken.startsWith("Bearer ")
      ? authToken
      : `Bearer ${authToken}`

    const res = await fetch(`${API_BASE_URL}/users/me/dashboard`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (!res.ok) return null
    const json = await res.json()
    return json.data || null
  } catch {
    return null
  }
}

export interface ApiTeamRoleWithTeam extends ApiTeamRole {
  team: ApiTeam
  user?: ApiTeamRoleUser | null
}

export interface ApiTeamsResponse {
  data: (ApiTeam | ApiTeamRoleWithTeam)[] | null
  message: string
  errors: null | any
}

export interface ApiTeamsResultResponse {
  status: number
  data: ApiTeam[] | null
  error?: string
}

/**
 * Normalizes GET /chains/:chainId/teams which returns TeamRole (status=accepted) UNION RequestJoin (status=pending).
 * Unwraps role.team -> ApiTeam so callers can always use team.competition.prize_deposits[0].
 * Propagates top-level `status`/`source` from the wrapper (team_role/request_join) onto the unwrapped team.
 */
function normalizeMyTeamsPayload(raw: unknown): ApiTeam[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item: any) => {
    if (item && typeof item === "object" && "team" in item && item.team && typeof item.team === "object" && "id" in item.team) {
      const team = item.team as ApiTeam & { status?: string; source?: string }
      if (item.status && !(team as any).status) (team as any).status = item.status
      if (item.source && !(team as any).source) (team as any).source = item.source
      // keep request_join id for debugging if needed
      if (item.id && !(team as any)._wrapperId) (team as any)._wrapperId = item.id
      return team as ApiTeam
    }
    return item as ApiTeam
  })
}

export async function fetchTeamsByCompetitionId(
  chainIdOrId: number | string,
  idMaybe?: string,
  token?: string | null | boolean
): Promise<ApiTeam[]> {
  let chainId: number
  let id: string
  if (typeof chainIdOrId === "number") { chainId = resolveChainId(chainIdOrId); id = idMaybe as string; } else { chainId = DEFAULT_CHAIN_ID; id = chainIdOrId as string; }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }
    const authToken = typeof token === "string" ? token : getStoredToken()
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`
    }

    // FIX: sebelumnya nge-hit api/v1/chains/<chain_id>/teams/competition/<competition_id> (404/legacy)
    // Sekarang pakai api/v1/chains/:chain_id/competitions/:competition_id/join-teams
    // Endpoint protected AuthSessionGuard, filter visibility=true, chain_id via indexer_state,
    // skip team yang sudah ada di request_join / team_role untuk user login.
    const res = await fetch(
      `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(id)}/join-teams`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )

    if (!res.ok) {
      return []
    }

    const json: ApiTeamsResponse = await res.json()
    return (json.data as ApiTeam[] | null) || []
  } catch {
    return []
  }
}

export async function fetchAllTeamsByCompetitionIdResult(
  chainIdOrId: number | string,
  idOrToken?: string | null,
  tokenMaybe?: string | null
): Promise<ApiTeamsResultResponse> {
  let chainId: number
  let id: string
  let token: string | null | undefined
  if (typeof chainIdOrId === "number") { chainId = resolveChainId(chainIdOrId); id = idOrToken as string; token = tokenMaybe; } else { chainId = DEFAULT_CHAIN_ID; id = chainIdOrId as string; token = idOrToken as any; }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }
    const authToken = typeof token === "string" ? token : getStoredToken()
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`
    }

    // UPDATED: migrasi dari GET /chains/:chainId/teams/competition/:id/all -> GET /chains/:chainId/competitions/:competitionId/join-teams (dan fallback)
    // Spec baru minta api/v1/chains/<chain_id>/competitions/<competition_id>, jadi id di sini adalah competitionId
    const candidates = [
      `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(id)}/join-teams`,
      `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(id)}/teams/public`,
    ]
    let lastRes: Response | null = null
    let lastJson: any = null
    for (const url of candidates) {
      try {
        const r = await fetch(url, { method: "GET", headers, cache: "no-store" })
        if (r.ok) {
          const j: ApiTeamsResponse = await r.json()
          return { status: r.status, data: (j.data as ApiTeam[] | null) || [] }
        }
        lastRes = r
        try { lastJson = await r.clone().json() } catch { lastJson = null }
      } catch {}
    }
    // Fallback: coba ambil semua teams milik user lalu filter by competition_id (berguna untuk owner/organizer di env dev)
    try {
      const fallbackRes = await fetch(`${API_BASE_URL}/chains/${chainId}/teams`, {
        method: "GET",
        headers,
        cache: "no-store",
      })
      if (fallbackRes.ok) {
        const fj = await fallbackRes.json()
        const raw: any[] = Array.isArray(fj.data) ? fj.data : []
        const normalized: ApiTeam[] = raw.map((x: any) => (x.team && x.team.id ? x.team : x) as ApiTeam)
        const filtered = normalized.filter((t: any) => t.competition_id === id || t.competition?.id === id || t.competition?.competition_id === id)
        if (filtered.length > 0) return { status: 200, data: filtered }
      }
    } catch {}
    if (lastRes) {
      let errorMessage = `HTTP ${lastRes.status}`
      if (lastJson && lastJson.message) errorMessage = lastJson.message
      return { status: lastRes.status, data: null, error: errorMessage }
    }
    return { status: 404, data: null, error: "No endpoint matched for competitions/<id> teams" }
  } catch (err: any) {
    return { status: 500, data: null, error: err?.message || "Fetch failed" }
  }
}

export async function fetchAllTeamsByCompetitionId(
  chainIdOrId: number | string,
  idOrToken?: string | null,
  tokenMaybe?: string | null
): Promise<ApiTeam[]> {
  let chainId: number
  let id: string
  let token: string | null | undefined
  if (typeof chainIdOrId === "number") { chainId = resolveChainId(chainIdOrId); id = idOrToken as string; token = tokenMaybe; } else { chainId = DEFAULT_CHAIN_ID; id = chainIdOrId as string; token = idOrToken as any; }
  const result = await fetchAllTeamsByCompetitionIdResult(chainId, id, token)
  return result.data || []
}

/**
 * GET /chains/:chainId/competitions/:competitionId/teams/organization — owner only (AuthSessionGuard).
 * Backend: GET api/v1/chains/:chain_id/competitions/:competition_id/teams/organization — protected by Bearer JWT.
 * Filter: competition.id OR competition.competition_id = :competition_id, competition.indexer_state.chain_id = :chainId,
 * competition.user_id = JWT sub (403 if not owner, 404 if competition not found on chain).
 * Returns { data: ApiTeam[] (include competition, skills_team, requirements_team, team_codes, team_roles->user, submission_project, request_joins), message, errors }
 * Used by organization views — returns ALL teams (public+private) unlike join-teams (visibility=true filtered).
 */
export async function fetchOrganizationTeamsByCompetitionIdResult(
  chainIdOrId: number | string,
  idOrToken?: string | null,
  tokenMaybe?: string | null
): Promise<ApiTeamsResultResponse> {
  let chainId: number
  let id: string
  let token: string | null | undefined
  if (typeof chainIdOrId === "number") { chainId = resolveChainId(chainIdOrId); id = idOrToken as string; token = tokenMaybe; } else { chainId = DEFAULT_CHAIN_ID; id = chainIdOrId as string; token = idOrToken as any; }
  if (!id) return { status: 400, data: null, error: "competitionId is required" }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }
    const authToken = typeof token === "string" ? token : getStoredToken()
    if (!authToken) {
      return { status: 401, data: null, error: "You must be authenticated (Bearer JWT required for teams/organization)" }
    }
    headers["Authorization"] = authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`

    const res = await fetch(
      `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(id)}/teams/organization`,
      { method: "GET", headers, cache: "no-store" }
    )
    if (res.ok) {
      const j: any = await res.json()
      const list = Array.isArray(j) ? j : (Array.isArray(j?.data) ? j.data : [])
      return { status: res.status, data: list }
    }
    let errorMessage = `HTTP ${res.status}`
    try {
      const j = await res.clone().json()
      if (j?.message) errorMessage = j.message
      else if (j?.errors) errorMessage = typeof j.errors === "string" ? j.errors : JSON.stringify(j.errors)
    } catch {}
    return { status: res.status, data: null, error: errorMessage }
  } catch (err: any) {
    return { status: 500, data: null, error: err?.message || "Fetch failed" }
  }
}

export async function fetchOrganizationTeamsByCompetitionId(
  chainIdOrId: number | string,
  idOrToken?: string | null,
  tokenMaybe?: string | null
): Promise<ApiTeam[]> {
  let chainId: number
  let id: string
  let token: string | null | undefined
  if (typeof chainIdOrId === "number") { chainId = resolveChainId(chainIdOrId); id = idOrToken as string; token = tokenMaybe; } else { chainId = DEFAULT_CHAIN_ID; id = chainIdOrId as string; token = idOrToken as any; }
  const result = await fetchOrganizationTeamsByCompetitionIdResult(chainId, id, token)
  const list = result?.data
  return Array.isArray(list) ? list : []
}

/**
 * GET /chains/:chainId/teams — protected by AuthSessionGuard
 * Patokan team_role.user_id = JWT sub (request.userId), filter chainId via competition.indexer_state_id.
 * Response: { data: ApiTeam[] (include competition, skills_team, requirements_team, team_codes, team_roles->user, request_joins, submission_project), message, errors }
 */
export async function fetchMyTeamsResult(
  chainIdOrToken?: number | string | null | boolean | Record<string, any>,
  tokenMaybe?: string | null | boolean | Record<string, any>
): Promise<ApiTeamsResultResponse> {
  let chainId: number
  let token: string | null | boolean | Record<string, any> | undefined
  if (typeof chainIdOrToken === "number") {
    chainId = resolveChainId(chainIdOrToken)
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    token = chainIdOrToken as any
  }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }
    const authToken =
      typeof token === "string"
        ? token
        : token === null || token === false
          ? null
          : getStoredToken()
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`
    }

    const res = await fetch(`${API_BASE_URL}/chains/${chainId}/teams`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}`
      try {
        const json = await res.json()
        if (json && json.message) errorMessage = json.message
        else if (json && json.error) errorMessage = json.error
      } catch {
        // fallback to status text
      }
      return { status: res.status, data: null, error: errorMessage }
    }

    const json: ApiTeamsResponse = await res.json()
    return { status: res.status, data: normalizeMyTeamsPayload(json.data) }
  } catch (err: any) {
    return { status: 500, data: null, error: err?.message || "Fetch failed" }
  }
}

export async function fetchMyTeams(
  chainIdOrToken?: number | string | null,
  tokenMaybe?: string | null
): Promise<ApiTeam[]> {
  let chainId: number
  let token: string | null | undefined
  if (typeof chainIdOrToken === "number") {
    chainId = resolveChainId(chainIdOrToken)
    token = tokenMaybe as string | null | undefined
  } else {
    chainId = DEFAULT_CHAIN_ID
    token = chainIdOrToken as string | null | undefined
  }
  const result = await fetchMyTeamsResult(chainId, token)
  return result.data || []
}

export interface UpdateTeamPayload {
  name?: string
  visibility?: boolean
  description?: string
  skills_team?: string[]
}

export async function updateTeamApi(
  chainIdOrTeamId: number | string,
  teamIdOrPayload?: string | UpdateTeamPayload,
  payloadOrToken?: UpdateTeamPayload | string | null,
  tokenMaybe?: string | null
): Promise<{ success: boolean; data?: ApiTeam; error?: string }> {
  let chainId: number
  let teamId: string
  let payload: UpdateTeamPayload
  let token: string | null | undefined
  if (typeof chainIdOrTeamId === "number") {
    chainId = resolveChainId(chainIdOrTeamId)
    teamId = teamIdOrPayload as string
    payload = payloadOrToken as UpdateTeamPayload
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    teamId = chainIdOrTeamId as string
    payload = teamIdOrPayload as UpdateTeamPayload
    token = payloadOrToken as string | null | undefined
  }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }
    const authToken = typeof token === "string" ? token : getStoredToken()
    if (!authToken) {
      return {
        success: false,
        error: "Unauthorized - missing authentication token",
      }
    }
    headers["Authorization"] = authToken.startsWith("Bearer ")
      ? authToken
      : `Bearer ${authToken}`

    const res = await fetch(
      `${API_BASE_URL}/chains/${chainId}/teams/${encodeURIComponent(teamId)}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      }
    )

    const json = await res.json()
    if (!res.ok) {
      return {
        success: false,
        error: json.message || "Failed to update team profile",
      }
    }

    return { success: true, data: json.data }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "An unexpected error occurred",
    }
  }
}

export interface TeamSubmissionResponse {
  data: ApiSubmissionProject | null
  status: number
  error?: string
}

export async function fetchTeamSubmissionResult(
  chainIdOrTeamId: number | string,
  teamIdOrToken?: string | null,
  tokenMaybe?: string | null
): Promise<TeamSubmissionResponse> {
  let chainId: number
  let teamId: string
  let token: string | null | undefined
  if (typeof chainIdOrTeamId === "number") {
    chainId = resolveChainId(chainIdOrTeamId)
    teamId = teamIdOrToken as string
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    teamId = chainIdOrTeamId as string
    token = teamIdOrToken as string | null | undefined
  }
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    }
    const authToken = typeof token === "string" ? token : getStoredToken()
    if (!authToken) {
      return { data: null, status: 401, error: "Unauthorized" }
    }
    headers["Authorization"] = authToken.startsWith("Bearer ")
      ? authToken
      : `Bearer ${authToken}`

    const res = await fetch(
      `${API_BASE_URL}/chains/${chainId}/teams/${encodeURIComponent(teamId)}/submission`,
      {
        headers,
      }
    )

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      return {
        data: null,
        status: res.status,
        error: json.message || `Request failed with status ${res.status}`,
      }
    }

    const json = await res.json()
    return {
      data: json.data || null,
      status: res.status,
    }
  } catch (err: any) {
    return {
      data: null,
      status: 500,
      error: err?.message || "An unexpected error occurred",
    }
  }
}

export interface CreateSubmissionPayload {
  title: string
  description?: string
  submission_link: string
  document_cid: string
}

export async function uploadToKuboIPFS(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch("/api/ipfs", {
    method: "POST",
    body: formData,
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(
      data.error || `Kubo IPFS upload failed with status ${res.status}`
    )
  }

  const cid: string = data.cid || data.hash || data.Hash || ""
  if (!cid) {
    throw new Error("Kubo IPFS response did not return a valid CID")
  }
  return cid
}

export async function submitTeamProjectSubmissionApi(
  chainIdOrTeamId: number | string,
  teamIdOrPayload?: string | CreateSubmissionPayload,
  payloadOrToken?: CreateSubmissionPayload | string | null,
  tokenMaybe?: string | null
): Promise<{ success: boolean; data?: any; error?: string }> {
  let chainId: number
  let teamId: string
  let payload: CreateSubmissionPayload
  let token: string | null | undefined
  if (typeof chainIdOrTeamId === "number") {
    chainId = resolveChainId(chainIdOrTeamId)
    teamId = teamIdOrPayload as string
    payload = payloadOrToken as CreateSubmissionPayload
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    teamId = chainIdOrTeamId as string
    payload = teamIdOrPayload as CreateSubmissionPayload
    token = payloadOrToken as string | null | undefined
  }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }
    const authToken = typeof token === "string" ? token : getStoredToken()
    if (!authToken) {
      return {
        success: false,
        error: "Unauthorized - missing authentication token",
      }
    }
    headers["Authorization"] = authToken.startsWith("Bearer ")
      ? authToken
      : `Bearer ${authToken}`

    const res = await fetch(
      `${API_BASE_URL}/chains/${chainId}/teams/${encodeURIComponent(teamId)}/submission`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }
    )

    const json = await res.json()
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: json.message || "Failed to submit project",
      }
    }

    return { success: true, status: res.status, data: json.data }
  } catch (err: any) {
    return {
      success: false,
      status: 500,
      error: err?.message || "An unexpected error occurred",
    }
  }
}

export interface ApiPrizeWinner {
  id: string
  winner_id?: string | number | null
  category: string
  amount: string | number
  certificate_cid?: string | null
  competition_id: string
  created_at?: string
  updated_at?: string | null
  deleted_at?: string | null
  winner?: {
    id: string
    wallet_address: string
    user_id: string
    prize_winner_id: string
    user?: {
      id: string
      wallet_address: string
      username?: string | null
      email?: string | null
      location?: string | null
      institution?: string | null
    } | null
  } | null
}

export interface ApiPrizeWinnersResponse {
  data: ApiPrizeWinner[] | null
  message: string
  errors: any
}

export async function fetchPrizeWinnersByCompetitionId(
  chainIdOrId: number | string,
  idOrToken?: string | null,
  tokenMaybe?: string | null
): Promise<ApiPrizeWinner[]> {
  let chainId: number
  let id: string
  let token: string | null | undefined
  if (typeof chainIdOrId === "number") { chainId = resolveChainId(chainIdOrId); id = idOrToken as string; token = tokenMaybe; } else { chainId = DEFAULT_CHAIN_ID; id = chainIdOrId as string; token = idOrToken as any; }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }
    const authToken = typeof token === "string" ? token : getStoredToken()
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`
    }

    const res = await fetch(
      `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(id)}/prize-winners`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )

    if (!res.ok) {
      return []
    }

    const json: ApiPrizeWinnersResponse = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

export interface ApiPrizeDistributed {
  id: string
  tx_hash: string
  treasury_prize_id: string
  competition_id: string
  token_address: string
  recipient: string
  amount: string
  created_at: string
}

// GET /api/v1/chains/:chainId/competitions/:id/prize-distributed
// Returns rows from prize_distributed; 404 (-> empty array here) when none exist yet.
export async function fetchPrizeDistributedByCompetitionId(
  chainId: number,
  id: string
): Promise<ApiPrizeDistributed[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/chains/${resolveChainId(chainId)}/competitions/${encodeURIComponent(id)}/prize-distributed`,
      { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" }
    )
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json?.data) ? json.data : []
  } catch {
    return []
  }
}

export interface ApiParticipantWinner {
  id: string
  tx_hash: string
  participant: string
  title: string
  competition_id: string
  prize_winner_id?: string | null
  created_at: string
  updated_at?: string | null
  deleted_at?: string | null
  user?: {
    id: string
    wallet_address: string
    username?: string | null
    email?: string | null
    location?: string | null
    institution?: string | null
  } | null
  prize_winner?: {
    id: string
    winner_id?: string | null
    category?: string | null
    amount?: string | null
    certificate_cid?: string | null
  } | null
  team?: {
    id: string
    name: string
    visibility?: boolean
    description?: string
  } | null
}

export interface ApiParticipantWinnersResponse {
  data: ApiParticipantWinner[]
  message?: string
  errors?: any
}

export async function fetchParticipantWinnersByCompetitionId(
  chainIdOrId: number | string,
  idOrToken?: string | null,
  tokenMaybe?: string | null
): Promise<ApiParticipantWinner[]> {
  let chainId: number
  let id: string
  let token: string | null | undefined
  if (typeof chainIdOrId === "number") {
    chainId = resolveChainId(chainIdOrId)
    id = idOrToken as string
    token = tokenMaybe
  } else {
    chainId = DEFAULT_CHAIN_ID
    id = chainIdOrId as string
    token = idOrToken as any
  }

  if (!id) return []

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }
    const authToken = typeof token === "string" ? token : getStoredToken()
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`
    }

    const res = await fetch(
      `${API_BASE_URL}/chains/${chainId}/competitions/${encodeURIComponent(id)}/participant-winners`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )

    if (!res.ok) {
      return []
    }

    const json: ApiParticipantWinnersResponse = await res.json()
    return Array.isArray(json.data) ? json.data : []
  } catch {
    return []
  }
}

/* ── participant-minted certificates (team-scoped) ──────────────────────────
 * API: GET /users/me/certificates/team/:teamId/participant-minted
 * Controller: cobalt-protocol-api/src/modules/certificate/certificate.controller.ts
 * Service:    findMyParticipantMinted(userId, teamId, query)
 * where { team_id: teamId, team: teamMembershipFilter, competition: { teams.some: teamMembershipFilter } }
 * Deprecated alias: GET /users/me/certificates/participant-minted (all teams)
 * ULID team.id is direct FK certificate_participant_minted.team_id
 * ────────────────────────────────────────────────────────────────────────── */
export interface ApiCertificateParticipantMinted {
  id: string
  tx_hash: string
  token_id: string | number | bigint
  competition_id: string
  team_id?: string | null
  user_id?: string | null
  uri: string
  indexer_state_id?: string | null
  created_at: string
  updated_at?: string | null
  deleted_at?: string | null
  team?: { id: string; name: string; competition_id: string; user_id: string } | null
  competition?: { id: string; competition_id?: string | null; tx_hash?: string | null; name: string; category: string; certificate_cid?: string | null; pirze_certificate_claim?: string | null } | null
  indexer_state?: { id: string; chain_id: number; contract_name: string } | null
}
export interface ApiCertificateParticipantMintedPaginated {
  data: ApiCertificateParticipantMinted[]
  meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean }
  message: string
  errors: null
}
export interface ApiParticipantCertificatesResult {
  status: number
  data: ApiCertificateParticipantMinted[] | null
  meta?: ApiCertificateParticipantMintedPaginated["meta"] | null
  error?: string
}
export interface FetchMyParticipantCertificatesQuery {
  page?: number
  limit?: number
  competitionId?: string
  chainId?: number
  search?: string
}
function isValidUlid(v: string): boolean {
  return /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(v)
}
/**
 * New signature: GET /users/me/certificates/team/:teamId/participant-minted
 * - :teamId ULID (FK certificate_participant_minted.team_id)
 * - Enforces team membership: team.user_id = sub OR team_role.user_id = sub
 * - Supports pagination + competitionId + chainId + search(uri)
 * - 404 when no rows for this team/user
 */
export async function fetchMyParticipantMintedCertificatesByTeamResult(
  teamId: string,
  query?: FetchMyParticipantCertificatesQuery | null,
  token?: string | null | boolean | Record<string, any>,
): Promise<ApiParticipantCertificatesResult> {
  if (!teamId || !isValidUlid(teamId)) {
    return { status: 400, data: null, error: `Invalid teamId ULID: ${teamId}` }
  }
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" }
    const authToken = typeof token === "string" ? token : token === null || token === false ? null : getStoredToken()
    if (authToken) headers["Authorization"] = authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`
    const qs = buildCertificateQueryString(query || undefined)
    const res = await fetch(`${API_BASE_URL}/users/me/certificates/team/${encodeURIComponent(teamId)}/participant-minted${qs}`, {
      method: "GET",
      headers,
      cache: "no-store",
    })
    if (!res.ok) {
      let msg = `HTTP ${res.status}`
      try { const j = await res.json(); if (j?.message) msg = j.message; else if (j?.error) msg = j.error } catch {}
      if (res.status === 404) return { status: 404, data: null, meta: null, error: msg }
      return { status: res.status, data: null, error: msg }
    }
    const json: ApiCertificateParticipantMintedPaginated = await res.json()
    return { status: res.status, data: json.data || [], meta: json.meta || null }
  } catch (err: any) {
    return { status: 500, data: null, error: err?.message || "Fetch failed" }
  }
}
export async function fetchMyParticipantMintedCertificatesByTeam(
  teamId: string,
  query?: FetchMyParticipantCertificatesQuery | null,
  token?: string | null,
): Promise<ApiCertificateParticipantMinted[]> {
  const r = await fetchMyParticipantMintedCertificatesByTeamResult(teamId, query, token as any)
  return r.data || []
}
/**
 * @deprecated Use fetchMyParticipantMintedCertificatesByTeamResult (team-scoped).
 * GET /users/me/certificates/participant-minted (all teams, legacy).
 */
export async function fetchMyParticipantMintedCertificatesAllResult(
  query?: FetchMyParticipantCertificatesQuery | null,
  token?: string | null | boolean | Record<string, any>,
): Promise<ApiParticipantCertificatesResult> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" }
    const authToken = typeof token === "string" ? token : token === null || token === false ? null : getStoredToken()
    if (authToken) headers["Authorization"] = authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`
    const qs = buildCertificateQueryString(query || undefined)
    const res = await fetch(`${API_BASE_URL}/users/me/certificates/participant-minted${qs}`, {
      method: "GET",
      headers,
      cache: "no-store",
    })
    if (!res.ok) {
      let msg = `HTTP ${res.status}`
      try { const j = await res.json(); if (j?.message) msg = j.message; else if (j?.error) msg = j.error } catch {}
      if (res.status === 404) return { status: 404, data: null, meta: null, error: msg }
      return { status: res.status, data: null, error: msg }
    }
    const json: ApiCertificateParticipantMintedPaginated = await res.json()
    return { status: res.status, data: json.data || [], meta: json.meta || null }
  } catch (err: any) {
    return { status: 500, data: null, error: err?.message || "Fetch failed" }
  }
}
function buildCertificateQueryString(q?: FetchMyParticipantCertificatesQuery): string {
  if (!q) return ""
  const p = new URLSearchParams()
  if (q.page != null) p.set("page", String(q.page))
  if (q.limit != null) p.set("limit", String(q.limit))
  if (q.competitionId) p.set("competitionId", q.competitionId)
  if (q.chainId != null) p.set("chainId", String(q.chainId))
  if (q.search) p.set("search", q.search)
  const s = p.toString()
  return s ? `?${s}` : ""
}

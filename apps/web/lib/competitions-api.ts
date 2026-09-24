import { formatUnits } from "viem"
import type { Competition, CompetitionCategory } from "@/features/competitions/types"

export interface ApiCompetitionWinner {
  id: string
  competition_id: string
  team_id?: string | null
  user_id?: string | null
  prize_amount?: number | null
  place?: number | null
  tx_hash?: string | null
  created_at: string
}

export interface ApiCompetition {
  id: string
  tx_hash?: string | null
  name: string
  category: string
  description: string
  requirement: string
  registration_window: string
  competition_window: string
  submission_deadline: string
  judging_review: string
  result_announcement: string
  pirze_certificate_claim: string
  certificate_cid?: string | null
  guidebook_cid?: string | null
  created_at: string
  prize_winners?: ApiCompetitionWinner[]
  user_id?: string | null
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

export function mapApiCompetitionToCompetition(apiComp: ApiCompetition): Competition {
  let category: CompetitionCategory = "Hackathon"
  const catLower = (apiComp.category || "").toLowerCase()
  if (catLower.includes("ai") || catLower.includes("ml")) {
    category = "AI & ML"
  } else if (catLower.includes("design") || catLower.includes("ux")) {
    category = "Design & UX"
  } else if (catLower.includes("sec") || catLower.includes("cyber")) {
    category = "Cyber Security"
  }

  const icon = category === "AI & ML" ? "bot" : category === "Cyber Security" ? "shield" : category === "Design & UX" ? "palette" : "landmark"

  const now = new Date()
  const regEnd = new Date(apiComp.registration_window || apiComp.submission_deadline || Date.now())
  const subEnd = new Date(apiComp.submission_deadline || Date.now())
  let status: Competition["status"] = "registration-open"
  if (now > subEnd) {
    status = "completed"
  } else if (regEnd.getTime() - now.getTime() < 7 * 86400000 && regEnd > now) {
    status = "closing-soon"
  }

  const generatedSlug = apiComp.name ? apiComp.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : apiComp.id
  const slug = generatedSlug || apiComp.id
  const ipfsGatewayUrl = (process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "http://localhost:8081/ipfs").replace(/\/$/, "")
  const guidebookUrl = apiComp.guidebook_cid
    ? apiComp.guidebook_cid.startsWith("http://") || apiComp.guidebook_cid.startsWith("https://")
      ? apiComp.guidebook_cid
      : `${ipfsGatewayUrl}/${apiComp.guidebook_cid.replace(/^ipfs:\/\//, "")}`
    : null

  const prizes = apiComp.prize_winners && apiComp.prize_winners.length > 0
    ? apiComp.prize_winners.map((w, i) => ({
        id: w.id || `prize-${i}`,
        title: `${w.place || i + 1}${i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"} Place`,
        amount: w.prize_amount || 5000,
        description: w.tx_hash ? `Reward (${w.tx_hash.slice(0, 10)}...)` : "Prize reward",
      }))
    : [
        { id: `${apiComp.id}-1st`, title: "1st Place Champion", amount: 25000, description: "Top prize pool" },
        { id: `${apiComp.id}-2nd`, title: "2nd Place Finalist", amount: 15000, description: "Runner up reward" },
      ]

  const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBA"

  const rawTxHash = apiComp.tx_hash || null
  const formattedTxHash = rawTxHash ? (rawTxHash.startsWith("0x") ? rawTxHash : `0x${rawTxHash}`) : null

  return {
    id: apiComp.id,
    slug,
    txHash: formattedTxHash,
    tx_hash: formattedTxHash,
    title: apiComp.name || "Untitled Competition",
    organizer: "Cobalt Protocol",
    organizerDescription: "Decentralized competition organizer on Cobalt Protocol.",
    category,
    tag: apiComp.category || category,
    icon,
    status,
    description: apiComp.description || "",
    requirement: apiComp.requirement || "",
    registrationEndsAt: apiComp.registration_window || new Date().toISOString(),
    startsAt: apiComp.registration_window || apiComp.competition_window || new Date().toISOString(),
    endsAt: apiComp.pirze_certificate_claim || apiComp.result_announcement || apiComp.submission_deadline || new Date().toISOString(),
    participants: 0,
    teamCount: 0,
    maxTeamSize: 5,
    currency: "USDC",
    prizes,
    timeline: [
      { id: "registration", title: "Registration Window", description: "Register team and form squad before window closes", dateLabel: fmtDate(apiComp.registration_window), status: now < new Date(apiComp.registration_window) ? "active" : "upcoming" },
      { id: "competition", title: "Competition Window", description: "Build project solution and collaborate", dateLabel: fmtDate(apiComp.competition_window), status: "upcoming" },
      { id: "submission", title: "Submission Deadline", description: "Final solution and repository submission", dateLabel: fmtDate(apiComp.submission_deadline), status: "upcoming" },
      { id: "judging", title: "Judging Review", description: "Project evaluation and scoring", dateLabel: fmtDate(apiComp.judging_review), status: "locked" },
      { id: "announcement", title: "Results & Claim", description: "Winners announcement and prize payout", dateLabel: fmtDate(apiComp.result_announcement || apiComp.pirze_certificate_claim), status: "locked" },
    ],
    judgingCriteria: [
      { id: "innovation", title: "Innovation & Impact", weight: 50, description: "Novelty & technical impact." },
      { id: "execution", title: "Code Architecture", weight: 50, description: "System design quality." },
    ],
    rules: apiComp.requirement ? [apiComp.requirement] : ["Follow Cobalt Protocol rules."],
    guidebookUrl,
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem("cobalt:access_token")
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

export async function fetchApiMe(token?: string | null): Promise<ApiUser | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    const authToken = typeof token === "string" ? token : getStoredToken()
    if (!authToken) return null
    headers["Authorization"] = authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`

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

export async function fetchApiCompetitions(token?: string | null | boolean | Record<string, any>): Promise<ApiCompetition[]> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    const authToken = typeof token === "string" ? token : (token === null || token === false ? null : getStoredToken())
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`
    }

    const res = await fetch(`${API_BASE_URL}/competitions`, {
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

export async function fetchCompetitions(token?: string | null | boolean | Record<string, any>): Promise<Competition[]> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    const authToken = typeof token === "string" ? token : (token === null || token === false ? null : getStoredToken())
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`
    }

    const res = await fetch(`${API_BASE_URL}/competitions`, {
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

export function getTokenSymbol(
  tokenAddress?: string | null,
  chainNativeSymbol?: string,
  tokenObjSymbol?: string
): string {
  if (tokenObjSymbol) {
    return tokenObjSymbol
  }
  if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000" || tokenAddress === "0x0") {
    return chainNativeSymbol || "BOHR"
  }
  return "USDC"
}

export function formatTokenPrize(
  totalPrize?: string | number | null,
  tokenAddress?: string | null,
  chainNativeSymbol?: string,
  decimals: number = 18,
  tokenObjSymbol?: string
): string {
  if (totalPrize === undefined || totalPrize === null || totalPrize === "") {
    return `0 ${getTokenSymbol(tokenAddress, chainNativeSymbol, tokenObjSymbol)}`
  }

  const symbol = getTokenSymbol(tokenAddress, chainNativeSymbol, tokenObjSymbol)
  const strVal = totalPrize.toString().trim()

  try {
    const bigVal = BigInt(strVal)
    if (bigVal >= 1_000_000_000n) {
      const formattedStr = formatUnits(bigVal, decimals)
      const numVal = parseFloat(formattedStr)
      if (!isNaN(numVal)) {
        return `${numVal.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${symbol}`
      }
      return `${formattedStr} ${symbol}`
    } else {
      const numVal = Number(strVal)
      if (!isNaN(numVal)) {
        return `${numVal.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${symbol}`
      }
    }
  } catch {
    const numVal = parseFloat(strVal)
    if (!isNaN(numVal)) {
      return `${numVal.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${symbol}`
    }
  }

  return `${strVal} ${symbol}`
}

export async function fetchApiCompetitionById(id: string, token?: string | Record<string, any>): Promise<ApiCompetition | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    const authToken = typeof token === "string" ? token : getStoredToken()
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`
    }

    const res = await fetch(`${API_BASE_URL}/competitions/${encodeURIComponent(id)}`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (!res.ok) {
      return null
    }

    const json: ApiSingleCompetitionResponse = await res.json()
    return json.data || null
  } catch {
    return null
  }
}

export async function fetchTokenPrizeByCompetitionId(id: string, token?: string | null | boolean | Record<string, any>): Promise<ApiTokenPrizeData | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    const authToken = typeof token === "string" ? token : (token === null || token === false ? null : getStoredToken())
    if (authToken) {
      headers["Authorization"] = authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`
    }

    const res = await fetch(`${API_BASE_URL}/competitions/${encodeURIComponent(id)}/token-prize`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (!res.ok) {
      return null
    }

    const json: ApiTokenPrizeResponse = await res.json()
    return json.data || null
  } catch {
    return null
  }
}

export async function fetchCompetitionById(id: string): Promise<Competition | null> {
  const apiData = await fetchApiCompetitionById(id)
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

export async function fetchPriceCompetitionById(id: string): Promise<ApiPriceCompetition | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/price-competitions/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })

    if (!res.ok) {
      return null
    }

    const json: ApiPriceCompetitionResponse = await res.json()
    return json.data || null
  } catch {
    return null
  }
}

export async function fetchListingTokenPrizes(): Promise<ApiListingTokenPrize[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/competitions/listing-token-prize`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })

    if (!res.ok) {
      return []
    }

    const json: ApiListingTokenPrizesResponse = await res.json()
    return json.data || []
  } catch {
    return []
  }
}


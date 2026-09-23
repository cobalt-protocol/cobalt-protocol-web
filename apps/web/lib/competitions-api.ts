import type { Competition, CompetitionCategory } from "@/features/competitions/types"
import { mockCompetitions } from "@/features/competitions/data/competitions"

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
  const guidebookUrl = apiComp.guidebook_cid ? `https://ipfs.io/ipfs/${apiComp.guidebook_cid}` : null

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

  return {
    id: apiComp.id,
    slug,
    title: apiComp.name || "Untitled Competition",
    organizer: "Cobalt Protocol",
    organizerDescription: apiComp.requirement || "Decentralized competition on Cobalt Protocol.",
    category,
    tag: apiComp.category || category,
    icon,
    status,
    description: apiComp.description || "",
    registrationEndsAt: apiComp.registration_window || new Date().toISOString(),
    startsAt: apiComp.competition_window || new Date().toISOString(),
    endsAt: apiComp.submission_deadline || new Date().toISOString(),
    participants: 0,
    teamCount: 0,
    maxTeamSize: 5,
    currency: "USDC",
    prizes,
    timeline: [
      { id: "registration", title: "Registration Window", description: apiComp.requirement || "Register team", dateLabel: fmtDate(apiComp.registration_window), status: now < new Date(apiComp.registration_window) ? "active" : "upcoming" },
      { id: "competition", title: "Competition Window", description: "Build project", dateLabel: fmtDate(apiComp.competition_window), status: "upcoming" },
      { id: "submission", title: "Submission Deadline", description: "Final submission", dateLabel: fmtDate(apiComp.submission_deadline), status: "upcoming" },
      { id: "judging", title: "Judging Review", description: "Project evaluation", dateLabel: fmtDate(apiComp.judging_review), status: "locked" },
      { id: "announcement", title: "Results & Claim", description: "Winners announcement", dateLabel: fmtDate(apiComp.result_announcement || apiComp.pirze_certificate_claim), status: "locked" },
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
  return (
    window.localStorage.getItem("accessToken") ||
    window.localStorage.getItem("cobalt:access_token") ||
    window.localStorage.getItem("cobalt:session_token")
  )
}

export async function fetchApiCompetitions(token?: string | Record<string, any>): Promise<ApiCompetition[]> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    const authToken = typeof token === "string" ? token : getStoredToken()
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

export async function fetchCompetitions(token?: string | Record<string, any>): Promise<Competition[]> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    const authToken = typeof token === "string" ? token : getStoredToken()
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

    if (!res.ok) return [...mockCompetitions]

    const json: ApiCompetitionsResponse = await res.json()
    if (!json.data || !Array.isArray(json.data) || json.data.length === 0) {
      return []
    }

    const apiMapped = json.data.map(mapApiCompetitionToCompetition)
    return apiMapped
  } catch {
    return [...mockCompetitions]
  }
}

export interface ApiSingleCompetitionResponse {
  data: ApiCompetition | null
  message: string
  errors: null | any
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

export async function fetchCompetitionById(id: string): Promise<Competition | null> {
  const apiData = await fetchApiCompetitionById(id)
  if (apiData) {
    return mapApiCompetitionToCompetition(apiData)
  }
  const fallback = mockCompetitions.find((c) => c.id === id || c.slug === id)
  return fallback || null
}

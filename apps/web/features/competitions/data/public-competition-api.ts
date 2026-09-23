import "server-only"

import { cache } from "react"
import type { Competition, CompetitionStatus, TimelineStage } from "../types"

interface PublicCompetitionResponse {
  id: string
  slug: string
  title: string
  category: string
  description: string
  requirements: string
  maxTeamSize: number
  registrationEndsAt: string
  startsAt: string
  endsAt: string
  teamCount: number
  guidebookCid: string
}

interface PublicCompetitionPage {
  data: PublicCompetitionResponse[]
}

const apiBaseUrl = () =>
  (process.env.COBALT_API_URL ?? "http://localhost:3001/api/v1").replace(
    /\/$/,
    ""
  )

async function apiRequest<T>(path: string): Promise<T | undefined> {
  const response = await fetch(`${apiBaseUrl()}${path}`, { cache: "no-store" })
  if (response.status === 404) return undefined
  if (!response.ok) throw new Error("Unable to load competition data")
  return (await response.json()) as T
}

function statusFor(
  competition: PublicCompetitionResponse,
  now: Date
): CompetitionStatus {
  const registrationEnd = new Date(competition.registrationEndsAt)
  if (now >= new Date(competition.endsAt)) return "completed"
  const daysRemaining =
    (registrationEnd.getTime() - now.getTime()) / 86_400_000
  return daysRemaining <= 7 ? "closing-soon" : "registration-open"
}

function timelineFor(
  competition: PublicCompetitionResponse,
  now: Date
): TimelineStage[] {
  const registrationEnd = new Date(competition.registrationEndsAt)
  const competitionStart = new Date(competition.startsAt)
  const competitionEnd = new Date(competition.endsAt)
  const format = (value: Date) =>
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(value)

  return [
    {
      id: "registration",
      title: "Registration",
      description: "Create or join a team before registration closes.",
      dateLabel: `Closes ${format(registrationEnd)} UTC`,
      status: now < registrationEnd ? "active" : "locked",
    },
    {
      id: "competition",
      title: "Competition",
      description: "Build the project and prepare the final submission.",
      dateLabel: `${format(competitionStart)} – ${format(competitionEnd)} UTC`,
      status:
        now < competitionStart
          ? "upcoming"
          : now <= competitionEnd
            ? "active"
            : "locked",
    },
  ]
}

function rulesFrom(requirements: string) {
  return requirements
    .split(/\r?\n/)
    .map((rule) => rule.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
}

function mapCompetition(
  competition: PublicCompetitionResponse,
  now = new Date()
): Competition {
  return {
    id: competition.id,
    slug: competition.slug,
    title: competition.title,
    organizer: "Cobalt organizer",
    organizerDescription:
      "Organizer information will appear after the public organization contract is expanded.",
    category: competition.category,
    tag: competition.category,
    icon: "landmark",
    status: statusFor(competition, now),
    description: competition.description,
    registrationEndsAt: competition.registrationEndsAt,
    startsAt: competition.startsAt,
    endsAt: competition.endsAt,
    participants: 0,
    teamCount: competition.teamCount,
    maxTeamSize: competition.maxTeamSize,
    currency: "TBD",
    prizes: [],
    timeline: timelineFor(competition, now),
    judgingCriteria: [],
    rules: rulesFrom(competition.requirements),
    guidebookUrl: /^https?:\/\//.test(competition.guidebookCid)
      ? competition.guidebookCid
      : null,
  }
}

export const fetchPublicCompetitionBySlug = cache(async (slug: string) => {
  const competition = await apiRequest<PublicCompetitionResponse>(
    `/competitions/${encodeURIComponent(slug)}`
  )
  return competition ? mapCompetition(competition) : undefined
})

export const fetchPublicCompetitions = cache(async () => {
  const page = await apiRequest<PublicCompetitionPage>(
    "/competitions?page=1&limit=50&sort=newest"
  )
  return page?.data.map((competition) => mapCompetition(competition)) ?? []
})

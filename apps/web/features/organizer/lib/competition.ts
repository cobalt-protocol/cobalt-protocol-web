import type {
  OrganizerCompetition,
  OrganizerCompetitionInput,
} from "../api/contracts"

export type CompetitionPhase =
  | "Draft"
  | "Registration"
  | "Competition"
  | "Judging"
  | "Completed"

export function getCompetitionPhase(
  competition: OrganizerCompetition,
  now = new Date()
): CompetitionPhase {
  if (competition.status === "DRAFT") return "Draft"
  if (now < new Date(competition.registrationEndsAt)) return "Registration"
  if (now < new Date(competition.submissionDeadline)) return "Competition"
  if (now < new Date(competition.resultsAt)) return "Judging"
  return "Completed"
}

export function formatCompetitionDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function toIsoDate(value: string) {
  return new Date(value).toISOString()
}

export function validateCompetitionInput(input: OrganizerCompetitionInput) {
  const timeline = [
    input.registrationEndsAt,
    input.startsAt,
    input.submissionDeadline,
    input.judgingEndsAt,
    input.resultsAt,
  ].map((value) => new Date(value).getTime())

  if (timeline.some(Number.isNaN)) return "Complete every timeline field."
  if (
    timeline.some(
      (value, index) => index > 0 && value <= timeline[index - 1]!
    )
  )
    return "Timeline must run from registration, competition, submission, judging, then results."
  return null
}

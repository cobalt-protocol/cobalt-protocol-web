export type OrganizerCompetitionStatus = "DRAFT" | "PUBLISHED"

export interface OrganizerCompetition {
  id: string
  slug: string | null
  status: OrganizerCompetitionStatus
  title: string
  category: string
  description: string
  requirements: string
  maxTeamSize: number
  registrationEndsAt: string
  startsAt: string
  submissionDeadline: string
  judgingEndsAt: string
  resultsAt: string
  guidebookCid: string
  certificateCid: string
  organization: { id: string; name: string } | null
  teamCount: number
  createdAt: string
  updatedAt: string | null
}

export interface OrganizerCompetitionPage {
  data: OrganizerCompetition[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface OrganizerCompetitionInput {
  title: string
  category: string
  description: string
  requirements: string
  maxTeamSize: number
  registrationEndsAt: string
  startsAt: string
  submissionDeadline: string
  judgingEndsAt: string
  resultsAt: string
  guidebookCid?: string
  certificateCid?: string
}

export interface ApiErrorEnvelope {
  error?: {
    code?: string
    message?: string
    details?: string[]
  }
}

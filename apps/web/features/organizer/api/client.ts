import type {
  ApiErrorEnvelope,
  OrganizerCompetition,
  OrganizerCompetitionInput,
  OrganizerCompetitionPage,
  OrganizerCompetitionStatus,
} from "./contracts"

export class OrganizerApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: string[]
  ) {
    super(message)
    this.name = "OrganizerApiError"
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set("Accept", "application/json")
  if (init?.body) headers.set("Content-Type", "application/json")

  const response = await fetch(path, {
    ...init,
    headers,
  })
  const payload = (await response.json().catch(() => null)) as
    | T
    | ApiErrorEnvelope
    | null

  if (!response.ok) {
    const error = payload as ApiErrorEnvelope | null
    throw new OrganizerApiError(
      error?.error?.message ?? "Request failed",
      response.status,
      error?.error?.code,
      error?.error?.details
    )
  }
  return payload as T
}

export function listOrganizerCompetitions(status?: OrganizerCompetitionStatus) {
  const query = status ? `?status=${status}` : ""
  return request<OrganizerCompetitionPage>(
    `/api/organizer/competitions${query}`
  )
}

export function getOrganizerCompetition(id: string) {
  return request<OrganizerCompetition>(
    `/api/organizer/competitions/${encodeURIComponent(id)}`
  )
}

export function createOrganizerCompetition(input: OrganizerCompetitionInput) {
  return request<OrganizerCompetition>("/api/organizer/competitions", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateOrganizerCompetition(
  id: string,
  input: Partial<OrganizerCompetitionInput>
) {
  return request<OrganizerCompetition>(
    `/api/organizer/competitions/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(input) }
  )
}

export function publishOrganizerCompetition(id: string) {
  return request<OrganizerCompetition>(
    `/api/organizer/competitions/${encodeURIComponent(id)}/publish`,
    { method: "POST" }
  )
}

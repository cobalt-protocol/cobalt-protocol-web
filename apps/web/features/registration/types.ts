import type { Competition } from "@/features/competitions/types"
import type { ApiTeam } from "@/lib/competitions-api"
export type RegistrationCompetition = Pick<
  Competition,
  "id" | "slug" | "title" | "maxTeamSize"
>
export type RegistrationDialog =
  | { kind: "wallet"; competition: RegistrationCompetition | null }
  | { kind: "profile"; competition: RegistrationCompetition | null }
  | { kind: "choice" | "create"; competition: RegistrationCompetition }
  | null
export interface PreviewMembership {
  competitionId?: string
  competitionSlug: string
  teamId: string
  teamName: string
  visibility: "public" | "private"
  requirements: string
  ownerUsername: string
  role: "lead" | "member"
  status: "active" | "pending"
  inviteCode: string | null
  rawTeam?: ApiTeam
}
export interface CreateTeamInput {
  name: string
  visibility: "public" | "private"
  requirements: string
  skills?: string[]
}

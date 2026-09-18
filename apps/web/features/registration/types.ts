import type { Competition } from "@/features/competitions/types"
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
  competitionSlug: string
  teamId: string
  teamName: string
  visibility: "public" | "private"
  requirements: string
  ownerUsername: string
  role: "lead" | "member"
  status: "active" | "pending"
  inviteCode: string | null
}
export interface CreateTeamInput {
  name: string
  visibility: "public" | "private"
  requirements: string
}

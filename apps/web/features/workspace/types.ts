export interface TeamMember {
  id: string
  name: string
  email: string
  role: "lead" | "member"
  initials: string
}
export interface JoinRequest {
  id: string
  member: TeamMember
  specialty: string
  location: string
  pitch: string
  skills: readonly string[]
}
export interface TeamState {
  name: string
  description?: string
  visibility?: boolean
  skills?: readonly string[]
  members: readonly TeamMember[]
  requests: readonly JoinRequest[]
}
export interface SubmissionDraft {
  title: string
  description: string
  link: string
}
export type TeamAction =
  | { type: "rename"; name: string }
  | {
      type: "update-details"
      name: string
      description?: string
      visibility?: boolean
      skills?: readonly string[]
    }
  | { type: "remove-member"; memberId: string }
  | { type: "decline-request"; requestId: string }
  | { type: "accept-request"; requestId: string; capacity: number }
  | { type: "set-team"; team: TeamState }

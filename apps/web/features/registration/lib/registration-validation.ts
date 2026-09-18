import type { BuilderProfile } from "@/features/profile/types"
import { isRecord } from "@/lib/type-guards"
import type { CreateTeamInput, PreviewMembership } from "../types"
export function isProfileComplete(
  profile: BuilderProfile | null
): profile is BuilderProfile {
  return (
    !!profile &&
    !!profile.username.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) &&
    !!profile.location.trim() &&
    !!profile.institution.trim() &&
    !!profile.pitch.trim() &&
    profile.skills.length > 0
  )
}
export function validateCreateTeam(input: CreateTeamInput): string | null {
  if (!input.name.trim()) return "Enter a team name."
  if (input.name.trim().length > 24)
    return "Team names can be at most 24 characters."
  if (!input.requirements.trim())
    return "Describe the roles or skills your team needs."
  if (input.requirements.length > 2000)
    return "Keep your requirements under 2,000 characters."
  return null
}
export function isMembershipList(value: unknown): value is PreviewMembership[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item: unknown) =>
        isRecord(item) &&
        [
          "competitionSlug",
          "teamId",
          "teamName",
          "requirements",
          "ownerUsername",
        ].every((key) => typeof item[key] === "string") &&
        (item.visibility === "public" || item.visibility === "private") &&
        (item.role === "lead" || item.role === "member") &&
        (item.status === "active" || item.status === "pending") &&
        (item.inviteCode === null || typeof item.inviteCode === "string")
    )
  )
}

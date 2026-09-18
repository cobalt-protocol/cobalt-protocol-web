import type { BuilderProfile } from "@/features/profile/types"
import type { PreviewMembership } from "../types"
import { isProfileComplete } from "./registration-validation"
export type RegistrationStep =
  "wallet" | "profile" | "choice" | "workspace" | "dashboard"
export function getRegistrationStep(
  connected: boolean,
  profile: BuilderProfile | null,
  membership?: PreviewMembership
): RegistrationStep {
  if (!connected) return "wallet"
  if (!isProfileComplete(profile)) return "profile"
  if (membership)
    return membership.status === "active" ? "workspace" : "dashboard"
  return "choice"
}

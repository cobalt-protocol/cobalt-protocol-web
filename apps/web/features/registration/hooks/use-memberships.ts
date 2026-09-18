"use client"
import { useBrowserDraft } from "@/lib/browser-draft"
import { isMembershipList } from "../lib/registration-validation"
import type { PreviewMembership } from "../types"

const emptyMemberships: PreviewMembership[] = []
export function useMemberships() {
  const {
    value: memberships,
    save,
    ready,
  } = useBrowserDraft(
    "cobalt:memberships:v1",
    emptyMemberships,
    isMembershipList
  )
  function addMembership(membership: PreviewMembership): boolean {
    if (
      memberships.some(
        (item) => item.competitionSlug === membership.competitionSlug
      )
    )
      return false
    return save([...memberships, membership])
  }
  function renameTeam(competitionSlug: string, name: string): boolean {
    if (!name.trim() || name.trim().length > 24) return false
    return save(
      memberships.map((item) =>
        item.competitionSlug === competitionSlug
          ? { ...item, teamName: name.trim() }
          : item
      )
    )
  }
  return { memberships, addMembership, renameTeam, ready }
}

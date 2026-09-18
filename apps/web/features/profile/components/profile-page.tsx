"use client"
import { Breadcrumbs, PageContainer } from "@/components/ui/page-primitives"
import { useBrowserDraft } from "@/lib/browser-draft"
import { routes } from "@/lib/routes"
import { useState } from "react"
import {
  isBuilderProfile,
  mockProfile,
  profileStorageKey,
} from "../data/profile"
import { ProfileEditor } from "./profile-editor"
import { useSiteActions } from "@/components/layout/site-actions"
import type { RegistrationCompetition } from "@/features/registration/types"
import { isProfileComplete } from "@/features/registration/lib/registration-validation"

export function ProfilePage({
  resumeCompetition,
  startEditing = false,
}: {
  resumeCompetition?: RegistrationCompetition
  startEditing?: boolean
}) {
  const { register } = useSiteActions()
  const { value, save, ready } = useBrowserDraft(
    profileStorageKey,
    mockProfile,
    isBuilderProfile
  )
  const [saved, setSaved] = useState(false)
  return (
    <PageContainer>
      <Breadcrumbs
        items={[{ label: "Home", href: routes.home }, { label: "Profile" }]}
      />
      <h1 className="sr-only">Builder Profile</h1>
      <p className="mb-5 text-xs text-muted-foreground">
        Profile preview · changes are saved only in this browser.
      </p>
      {saved && (
        <p
          role="status"
          className="mb-5 rounded-lg bg-teal-50 p-3 text-sm text-teal-800"
        >
          Profile saved in this browser.
        </p>
      )}
      {ready ? (
        <ProfileEditor
          key={resumeCompetition?.slug ?? (startEditing ? "setup" : "profile")}
          initialProfile={value}
          startEditing={startEditing || !!resumeCompetition}
          onSave={(next) => {
            const success = save(next)
            setSaved(success)
            if (success && resumeCompetition && isProfileComplete(next))
              register(resumeCompetition, next)
            return success
          }}
        />
      ) : (
        <p role="status">Loading profile…</p>
      )}
    </PageContainer>
  )
}

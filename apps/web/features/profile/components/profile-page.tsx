"use client"
import { Breadcrumbs, PageContainer } from "@/components/ui/page-primitives"
import { useBrowserDraft } from "@/lib/browser-draft"
import { routes } from "@/lib/routes"
import { useEffect, useState } from "react"
import {
  emptyProfile,
  isBuilderProfile,
  mockProfile,
  profileStorageKey,
} from "../data/profile"
import { ProfileEditor } from "./profile-editor"
import { useSiteActions } from "@/components/layout/site-actions"
import type { RegistrationCompetition } from "@/features/registration/types"
import { isProfileComplete } from "@/features/registration/lib/registration-validation"
import { getMe } from "@/lib/auth-api"
import {
  getMyProfile,
  updateMyProfile,
  mapApiProfileToBuilderProfile,
  type UpdateProfilePayload,
} from "@/lib/profile-api"
import type { BuilderProfile } from "../types"

export function ProfilePage({
  resumeCompetition,
  startEditing = false,
}: {
  resumeCompetition?: RegistrationCompetition
  startEditing?: boolean
}) {
  const { sessionToken, user, register } = useSiteActions()
  const { value, save, ready } = useBrowserDraft(
    profileStorageKey,
    mockProfile,
    isBuilderProfile
  )

  const [activeProfile, setActiveProfile] = useState<BuilderProfile>(() => {
    if (sessionToken && user) {
      return mapApiProfileToBuilderProfile(user)
    }
    return sessionToken ? emptyProfile : (value || mockProfile)
  })
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [isFetchingRemote, setIsFetchingRemote] = useState<boolean>(false)

  // Sync activeProfile with local browser draft only when NOT authenticated
  useEffect(() => {
    if (!sessionToken && ready && value) {
      setActiveProfile(value)
    }
  }, [sessionToken, ready, value])

  // Sync initial user from site actions context if available
  useEffect(() => {
    if (sessionToken && user) {
      const mapped = mapApiProfileToBuilderProfile(user)
      setActiveProfile(mapped)
    }
  }, [sessionToken, user])

  // Fetch remote user profile via /auth/me when sessionToken is present
  useEffect(() => {
    if (!sessionToken) return

    let isMounted = true
    setIsFetchingRemote(true)

    getMe(sessionToken)
      .then((res) => {
        if (!isMounted) return
        if (res?.data?.user) {
          const remoteProfile = mapApiProfileToBuilderProfile(res.data.user)
          setActiveProfile(remoteProfile)
          save(remoteProfile)
        } else {
          return getMyProfile(sessionToken).then((pRes) => {
            if (!isMounted) return
            if (pRes?.data) {
              const remoteProfile = mapApiProfileToBuilderProfile(pRes.data)
              setActiveProfile(remoteProfile)
              save(remoteProfile)
            }
          })
        }
      })
      .catch((err) => {
        if (!isMounted) return
        getMyProfile(sessionToken)
          .then((pRes) => {
            if (!isMounted) return
            if (pRes?.data) {
              const remoteProfile = mapApiProfileToBuilderProfile(pRes.data)
              setActiveProfile(remoteProfile)
              save(remoteProfile)
            }
          })
          .catch((pErr) => {
            console.warn("Could not fetch remote profile:", err || pErr)
          })
      })
      .finally(() => {
        if (isMounted) setIsFetchingRemote(false)
      })

    return () => {
      isMounted = false
    }
  }, [sessionToken])

  async function handleSave(next: BuilderProfile): Promise<boolean> {
    setSavedMessage(null)

    if (sessionToken) {
      const payload: UpdateProfilePayload = {
        username: next.username,
        email: next.email,
        location: next.location,
        institution: next.institution,
        pitch: next.pitch,
        description: next.pitch,
        github_link: next.github_link || "",
        linkedin_link: next.linkedin_link || "",
        skills: next.skills.map((s) => ({ name: s.name, level: s.level })),
      }

      const res = await updateMyProfile(sessionToken, payload)
      if (res.data) {
        // Re-fetch via /auth/me to ensure fresh profile state
        let updatedProfile = mapApiProfileToBuilderProfile(res.data)
        try {
          const meRes = await getMe(sessionToken)
          if (meRes?.data?.user) {
            updatedProfile = mapApiProfileToBuilderProfile(meRes.data.user)
          }
        } catch {
          // Use res.data fallback
        }

        setActiveProfile(updatedProfile)
        save(updatedProfile)
        setSavedMessage("Profile updated successfully on Cobalt Protocol server.")

        if (resumeCompetition && isProfileComplete(updatedProfile)) {
          register(resumeCompetition, updatedProfile)
        }
        return true
      }
      return false
    } else {
      const success = save(next)
      if (success) {
        setActiveProfile(next)
        setSavedMessage("Profile saved in browser storage. Connect wallet to sync with Cobalt API.")
        if (resumeCompetition && isProfileComplete(next)) {
          register(resumeCompetition, next)
        }
      }
      return success
    }
  }

  return (
    <PageContainer>
      <Breadcrumbs
        items={[{ label: "Home", href: routes.home }, { label: "Profile" }]}
      />
      <h1 className="sr-only">Builder Profile</h1>
      <p className="mb-5 text-xs text-muted-foreground" suppressHydrationWarning>
        {sessionToken
          ? "Authenticated builder profile · Changes are synced to Cobalt Protocol API."
          : "Local builder profile preview · Connect wallet to authenticate and sync changes."}
      </p>
      {savedMessage && (
        <p
          role="status"
          className="mb-5 rounded-lg bg-teal-500/10 p-3 text-sm font-medium text-teal-800 dark:text-teal-200"
        >
          {savedMessage}
        </p>
      )}
      {isFetchingRemote ? (
        <div role="status" className="flex items-center space-x-2 py-8 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading profile from server…</span>
        </div>
      ) : ready || sessionToken ? (
        <ProfileEditor
          key={
            sessionToken
              ? `auth-${activeProfile.username}-${activeProfile.email}`
              : resumeCompetition?.slug ?? (startEditing ? "setup" : "profile")
          }
          initialProfile={activeProfile}
          onSave={handleSave}
        />
      ) : (
        <p role="status">Loading profile…</p>
      )}
    </PageContainer>
  )
}



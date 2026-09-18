"use client"
import { createContext, useContext, useState, type ReactNode } from "react"
import { Button } from "@workspace/ui/components/button"
import { Modal } from "@/components/ui/modal"
import { WalletOnboardingDialog } from "@/features/registration/components/wallet-onboarding-dialog"
import { useRouter } from "next/navigation"
import { useBrowserDraft } from "@/lib/browser-draft"
import { routes } from "@/lib/routes"
import {
  isBuilderProfile,
  mockProfile,
  profileStorageKey,
} from "@/features/profile/data/profile"
import type { BuilderProfile } from "@/features/profile/types"
import { useMemberships } from "@/features/registration/hooks/use-memberships"
import {
  isProfileComplete,
  validateCreateTeam,
} from "@/features/registration/lib/registration-validation"
import { RegistrationDialogs } from "@/features/registration/components/registration-dialogs"
import { getRegistrationStep } from "@/features/registration/lib/registration-step"
import type {
  CreateTeamInput,
  PreviewMembership,
  RegistrationCompetition,
  RegistrationDialog,
} from "@/features/registration/types"
const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean"
const isOptionalProfile = (value: unknown): value is BuilderProfile | null =>
  value === null || isBuilderProfile(value)
interface SiteActions {
  joinTeam: (membership: PreviewMembership) => string | null
  openWallet: () => void
  showNotice: (message: string) => void
  connected: boolean
  disconnectWallet: () => void
  register: (
    competition: RegistrationCompetition,
    profileOverride?: BuilderProfile
  ) => void
}
const SiteActionsContext = createContext<SiteActions | null>(null)
export function useSiteActions(): SiteActions {
  const context = useContext(SiteActionsContext)
  if (!context)
    throw new Error("useSiteActions must be used within SiteActionsProvider")
  return context
}
export function SiteActionsProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { value: storedConnected, save: saveConnected } = useBrowserDraft(
    "cobalt:wallet-preview:v1",
    false,
    isBoolean
  )
  const [sessionConnected, setSessionConnected] = useState<boolean | null>(null)
  const connected = sessionConnected ?? storedConnected
  const { value: savedProfile } = useBrowserDraft<BuilderProfile | null>(
    profileStorageKey,
    null,
    isOptionalProfile
  )
  const profile = savedProfile ?? mockProfile
  const { memberships, addMembership } = useMemberships()
  const [dialog, setDialog] = useState<RegistrationDialog>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const walletOpen = dialog?.kind === "wallet"
  function setWalletOpen(open: boolean) {
    setDialog((current) =>
      open
        ? { kind: "wallet", competition: null }
        : current?.kind === "wallet"
          ? null
          : current
    )
  }
  function navigate(href: string) {
    setDialog(null)
    router.push(href)
  }
  function disconnectWallet() {
    setSessionConnected(saveConnected(false) ? null : false)
    setDialog(null)
    setNotice(null)
  }
  function register(
    competition: RegistrationCompetition,
    profileOverride?: BuilderProfile
  ) {
    continueRegistration(
      competition,
      connected,
      profileOverride ?? savedProfile
    )
  }
  function continueRegistration(
    competition: RegistrationCompetition,
    walletConnected: boolean,
    currentProfile: BuilderProfile | null
  ) {
    const membership = memberships.find(
      (item) => item.competitionSlug === competition.slug
    )
    const step = getRegistrationStep(
      walletConnected,
      currentProfile,
      membership
    )
    if (step === "workspace" || step === "dashboard") {
      navigate(
        step === "workspace"
          ? routes.workspace(competition.slug)
          : routes.dashboard
      )
    } else setDialog({ kind: step, competition })
  }
  function connectPreview() {
    setSessionConnected(saveConnected(true) ? null : true)
    const competition = dialog?.competition ?? null
    if (!isProfileComplete(savedProfile)) {
      setDialog({ kind: "profile", competition })
      return
    }
    if (!competition) {
      setDialog(null)
      return
    }
    continueRegistration(competition, true, savedProfile)
  }
  function joinTeam(membership: PreviewMembership): string | null {
    if (!connected || !isProfileComplete(savedProfile))
      return "Connect your wallet and complete your profile first."
    if (!addMembership(membership))
      return "Could not save this team. You may already have a team here, or browser storage is unavailable."
    navigate(
      membership.status === "active"
        ? routes.workspace(membership.competitionSlug)
        : routes.dashboard
    )
    return null
  }
  function createTeam(input: CreateTeamInput): string | null {
    const error = validateCreateTeam(input)
    if (error) return error
    if (dialog?.kind !== "create") return "Reopen the team form to continue."
    const id = crypto.randomUUID()
    return joinTeam({
      competitionSlug: dialog.competition.slug,
      teamId: id,
      teamName: input.name.trim(),
      visibility: input.visibility,
      requirements: input.requirements.trim(),
      ownerUsername: profile.username,
      role: "lead",
      status: "active",
      inviteCode:
        input.visibility === "private"
          ? `COBALT-${id.slice(0, 8).toUpperCase()}`
          : null,
    })
  }
  return (
    <SiteActionsContext.Provider
      value={{
        openWallet: () => {
          if (!connected) setWalletOpen(true)
          else setNotice("Your wallet is connected in preview mode.")
        },
        showNotice: setNotice,
        connected,
        disconnectWallet,
        register,
        joinTeam,
      }}
    >
      {children}
      <WalletOnboardingDialog
        open={walletOpen}
        onOpenChange={setWalletOpen}
        onConnect={connectPreview}
      />
      <RegistrationDialogs
        dialog={dialog}
        profile={profile}
        onChange={setDialog}
        onNavigate={navigate}
        onCreate={createTeam}
      />
      <Modal
        open={notice !== null}
        onOpenChange={(open) => {
          if (!open) setNotice(null)
        }}
        title="Cobalt Protocol"
      >
        <p className="mt-5 text-sm leading-7 text-muted-foreground">{notice}</p>
        <Button className="mt-6 h-10 w-full" onClick={() => setNotice(null)}>
          Got it
        </Button>
      </Modal>
    </SiteActionsContext.Provider>
  )
}

"use client"
import { createContext, useContext, useState, type ReactNode } from "react"
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi"
import { Button } from "@workspace/ui/components/button"
import { Modal } from "@/components/ui/modal"
import { useRouter } from "next/navigation"
import { useBrowserDraft } from "@/lib/browser-draft"
import { routes } from "@/lib/routes"
import { botChainTestnet, addBotChainTestnetToWallet } from "@/lib/wagmi"
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
  address?: string
  chainName?: string
  isWrongNetwork?: boolean
  switchNetwork?: () => void
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

  const { address, isConnected: isWagmiConnected, chain } = useAccount()
  const { connectors, connectAsync } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()

  const isWrongNetwork = Boolean(isWagmiConnected && chainId !== botChainTestnet.id)

  const { value: storedConnected, save: saveConnected } = useBrowserDraft(
    "cobalt:wallet-preview:v1",
    false,
    isBoolean
  )
  const [sessionConnected, setSessionConnected] = useState<boolean | null>(null)
  const connected = isWagmiConnected
  const { value: savedProfile } = useBrowserDraft<BuilderProfile | null>(
    profileStorageKey,
    null,
    isOptionalProfile
  )
  const profile = savedProfile ?? mockProfile
  const { memberships, addMembership } = useMemberships()
  const [dialog, setDialog] = useState<RegistrationDialog>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  function navigate(href: string) {
    setDialog(null)
    router.push(href)
  }

  async function handleOpenWallet() {
    if (isWagmiConnected) {
      if (isWrongNetwork) {
        try {
          await switchChainAsync({ chainId: botChainTestnet.id })
        } catch {
          await addBotChainTestnetToWallet()
        }
      } else {
        setNotice("Your wallet is connected to " + (chain?.name ?? botChainTestnet.name) + ".")
      }
      return
    }

    if (isConnecting) return

    if (typeof window === "undefined" || !(window as any).ethereum) {
      setNotice("MetaMask wallet extension is not installed in your browser. Please install MetaMask to connect.")
      return
    }

    setIsConnecting(true)

    try {
      const targetConnector =
        connectors.find((c) => c.id === "metaMask" || c.name.toLowerCase().includes("metamask")) ||
        connectors.find((c) => c.id === "injected") ||
        connectors[0]

      if (targetConnector) {
        try {
          await connectAsync({ connector: targetConnector })
        } catch (wagmiErr: any) {
          if (wagmiErr?.code === 4001 || wagmiErr?.message?.includes("rejected")) {
            return
          }
          await (window as any).ethereum.request({ method: "eth_requestAccounts" })
        }
      } else {
        await (window as any).ethereum.request({ method: "eth_requestAccounts" })
      }

      try {
        await switchChainAsync({ chainId: botChainTestnet.id })
      } catch {
        await addBotChainTestnetToWallet()
      }

      const competition = dialog?.competition ?? null
      if (!isProfileComplete(savedProfile)) {
        setDialog({ kind: "profile", competition })
      } else if (competition) {
        continueRegistration(competition, true, savedProfile)
      } else {
        setDialog(null)
      }
    } catch (err: any) {
      const msg = String(err?.message || err?.shortMessage || "").toLowerCase()
      const name = String(err?.name || "")
      const code = err?.code ?? err?.cause?.code

      if (
        code === 4001 ||
        name === "UserRejectedRequestError" ||
        msg.includes("user rejected") ||
        msg.includes("rejected")
      ) {
        return
      }
      if (
        code === -32002 ||
        name === "ResourceUnavailableRpcError" ||
        msg.includes("already processing") ||
        msg.includes("already pending")
      ) {
        return
      }
      if (name === "ConnectorAlreadyConnectedError" || msg.includes("already connected")) {
        return
      }
      if (
        name === "ProviderNotFoundError" ||
        msg.includes("provider not found")
      ) {
        setNotice("MetaMask wallet extension is not detected or inactive. Please enable MetaMask.")
        return
      }

      console.error("MetaMask connection error:", err)
      setNotice(err?.shortMessage || err?.message || "Could not connect to MetaMask.")
    } finally {
      setIsConnecting(false)
    }
  }

  async function handleDisconnectWallet() {
    if (isWagmiConnected) {
      try {
        await disconnectAsync()
      } catch {
        // Ignore disconnect errors
      }
    }
    setSessionConnected(saveConnected(false) ? null : false)
    setDialog(null)
    setNotice(null)
  }

  async function handleSwitchNetwork() {
    try {
      await switchChainAsync({ chainId: botChainTestnet.id })
    } catch {
      const added = await addBotChainTestnetToWallet()
      if (!added) {
        setNotice(`Could not switch network automatically. Please switch to ${botChainTestnet.name} in your wallet.`)
      }
    }
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
    if (step === "wallet") {
      handleOpenWallet()
      return
    }
    if (step === "workspace" || step === "dashboard") {
      navigate(
        step === "workspace"
          ? routes.workspace(competition.slug)
          : routes.dashboard
      )
    } else setDialog({ kind: step, competition })
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
        openWallet: handleOpenWallet,
        showNotice: setNotice,
        connected,
        address: address ? String(address) : undefined,
        chainName: chain?.name,
        isWrongNetwork,
        switchNetwork: handleSwitchNetwork,
        disconnectWallet: handleDisconnectWallet,
        register,
        joinTeam,
      }}
    >
      {children}
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

"use client"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useAccount, useBalance, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi"
import { formatUnits } from "viem"
import { useModal } from "connectkit"
import { Button } from "@workspace/ui/components/button"
import { Modal } from "@/components/ui/modal"
import { useRouter } from "next/navigation"
import { useBrowserDraft } from "@/lib/browser-draft"
import { routes } from "@/lib/routes"
import { botChainTestnet, addBotChainTestnetToWallet, connectMetaMaskDirectly, disconnectMetaMaskDirectly } from "@/lib/wagmi"
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
  balance?: string
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
  const { setOpen: setConnectKitOpen } = useModal()

  const { value: storedConnected, save: saveConnected } = useBrowserDraft(
    "cobalt:wallet-preview:v1",
    false,
    isBoolean
  )
  const [sessionConnected, setSessionConnected] = useState<boolean | null>(null)
  const [directAddress, setDirectAddress] = useState<string | null>(null)
  const [userDisconnected, setUserDisconnected] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("cobalt:disconnected") === "true"
    }
    return false
  })

  const connected = !userDisconnected && (isWagmiConnected || Boolean(directAddress) || Boolean(sessionConnected ?? storedConnected))
  const effectiveAddress = !userDisconnected ? (address ? String(address) : directAddress ?? undefined) : undefined
  const isWrongNetwork = Boolean(!userDisconnected && isWagmiConnected && chainId !== botChainTestnet.id)

  const { data: balanceData } = useBalance({
    address:
      effectiveAddress && effectiveAddress.startsWith("0x")
        ? (effectiveAddress as `0x${string}`)
        : undefined,
  })

  const balance = connected
    ? balanceData
      ? `${formatUnits(balanceData.value, balanceData.decimals)} ${balanceData.symbol}`
      : `0.00 ${chain?.nativeCurrency?.symbol || "BOT"}`
    : "Not connected"

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return

    const eth = (window as any).ethereum
    const provider =
      eth.providers && Array.isArray(eth.providers)
        ? eth.providers.find((p: any) => p.isMetaMask) || eth
        : eth

    const checkAccounts = async () => {
      if (window.localStorage.getItem("cobalt:disconnected") === "true") {
        return
      }
      try {
        const accs: string[] = await provider.request({ method: "eth_accounts" })
        if (accs && accs.length > 0 && accs[0]) {
          setDirectAddress(accs[0])
          setSessionConnected(true)
        }
      } catch (e) {
        console.log("Error checking accounts:", e)
      }
    }

    checkAccounts()

    const handleAccountsChanged = (accs: string[]) => {
      if (window.localStorage.getItem("cobalt:disconnected") === "true") {
        return
      }
      if (accs && accs.length > 0 && accs[0]) {
        setDirectAddress(accs[0])
        setSessionConnected(true)
        saveConnected(true)
      } else {
        setDirectAddress(null)
        setSessionConnected(false)
        saveConnected(false)
      }
    }

    provider.on?.("accountsChanged", handleAccountsChanged)
    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged)
    }
  }, [saveConnected])
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
    if (isConnecting) return

    try {
      setIsConnecting(true)
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("cobalt:disconnected")
      }
      setUserDisconnected(false)

      try {
        setConnectKitOpen(true)
      } catch (modalErr) {
        console.warn("ConnectKit modal open error, using direct connection fallback:", modalErr)
        await connectMetaMaskDirectly()
      }
    } catch (err: any) {
      const errMsg = String(err?.message || "").toLowerCase()
      if (err?.code === 4001 || errMsg.includes("rejected") || errMsg.includes("user denied")) {
        return
      }
      console.error("Wallet connection error:", err)
      alert(err?.message || "Gagal terhubung ke dompet Web3.")
    } finally {
      setIsConnecting(false)
    }
  }

  async function handleDisconnectWallet() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cobalt:disconnected", "true")
    }
    setUserDisconnected(true)

    // 1. Hard disconnect: revoke eth_accounts permission from MetaMask extension
    await disconnectMetaMaskDirectly()

    // 2. Disconnect Wagmi session
    if (isWagmiConnected) {
      try {
        await disconnectAsync()
      } catch {
        // Ignore disconnect errors
      }
    }
    setDirectAddress(null)
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
        address: effectiveAddress,
        balance,
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

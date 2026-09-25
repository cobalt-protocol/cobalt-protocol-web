"use client"
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { useAccount, useBalance, useConnect, useDisconnect, useChainId, useSwitchChain, useSignMessage } from "wagmi"
import { formatUnits } from "viem"
import { useModal } from "connectkit"
import { Button } from "@workspace/ui/components/button"
import { Modal } from "@/components/ui/modal"
import { useRouter } from "next/navigation"
import { useBrowserDraft } from "@/lib/browser-draft"
import { routes } from "@/lib/routes"
import { generateNonce, verifySignature, getMe, type User, type UserRole } from "@/lib/auth-api"
import { mapApiProfileToBuilderProfile } from "@/lib/profile-api"
import { createCompetitionTeam, fetchMyTeams, type ApiTeam } from "@/lib/competitions-api"
import { botChainTestnet, addBotChainTestnetToWallet, connectMetaMaskDirectly, disconnectMetaMaskDirectly, signMessageWithViem } from "@/lib/wagmi"
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
  profile: BuilderProfile
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
  nonce?: string | null
  nonceMessage?: string | null
  isGeneratingNonce?: boolean
  refetchNonce?: () => Promise<void>
  signNonce?: () => Promise<string | null>
  signature?: string | null
  isSigningNonce?: boolean
  sessionToken?: string | null
  accessToken?: string | null
  userRole?: UserRole | null
  user?: User | null
  isVerifyingSignature?: boolean
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
  const { signMessageAsync, isPending: isSigningWagmi } = useSignMessage()

  const [sessionConnected, setSessionConnected] = useState<boolean | null>(null)
  const [directAddress, setDirectAddress] = useState<string | null>(null)
  const [userDisconnected, setUserDisconnected] = useState<boolean>(false)

  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("cobalt:access_token")
    }
    return null
  })
  const [authenticatedAddress, setAuthenticatedAddress] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const keysToRemove = [
        "cobalt:disconnected",
        "cobalt:authenticated_address",
        "cobalt:user_role",
        "cobalt:user",
        "cobalt:wallet-preview:v1",
        "cobalt:profile:v1",
        "cobalt:memberships:v1",
      ]
      for (const k of keysToRemove) {
        try {
          window.localStorage.removeItem(k)
        } catch {}
      }
    }
  }, [])

  const effectiveAddress = !userDisconnected ? (address ? String(address) : directAddress ?? undefined) : undefined
  const isAddressConnected = Boolean(!userDisconnected && (isWagmiConnected || Boolean(directAddress)))
  const isSessionValid = Boolean(sessionToken) && Boolean(effectiveAddress && authenticatedAddress && authenticatedAddress.toLowerCase() === effectiveAddress.toLowerCase())
  const connected = isAddressConnected && isSessionValid
  const isWrongNetwork = Boolean(!userDisconnected && isWagmiConnected && chainId !== botChainTestnet.id)

  const [nonce, setNonce] = useState<string | null>(null)
  const [nonceMessage, setNonceMessage] = useState<string | null>(null)
  const [isGeneratingNonce, setIsGeneratingNonce] = useState<boolean>(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [isSigningNonceState, setIsSigningNonceState] = useState<boolean>(false)
  const isSigningNonce = isSigningWagmi || isSigningNonceState
  const [isVerifyingSignature, setIsVerifyingSignature] = useState<boolean>(false)

  const isAuthInProgressRef = useRef(false)

  useEffect(() => {
    if (!sessionToken) {
      setUser(null)
      setUserRole(null)
      setAuthenticatedAddress(null)
      return
    }

    getMe(sessionToken)
      .then((res) => {
        if (res.data?.user) {
          const u = res.data.user
          setUser(u)
          if (u.role) setUserRole(u.role)
          if (u.wallet_address) setAuthenticatedAddress(u.wallet_address)
        }
      })
      .catch((err) => {
        console.warn("Could not fetch user profile from API:", err)
      })
  }, [sessionToken])

  // Wallet Connection Auth Flow:
  // Connect Wallet -> Generate Nonce (API) -> Sign Message with Viem -> Verify Signature (API) -> Connection Complete
  useEffect(() => {
    if (!effectiveAddress || userDisconnected) {
      return
    }

    const isAlreadyAuthenticated =
      Boolean(sessionToken) &&
      Boolean(authenticatedAddress) &&
      authenticatedAddress?.toLowerCase() === effectiveAddress.toLowerCase()

    if (isAlreadyAuthenticated) {
      return
    }

    if (isAuthInProgressRef.current) {
      return
    }

    let isMounted = true
    isAuthInProgressRef.current = true

    async function performAuthFlow() {
      try {
        setIsGeneratingNonce(true)

        // Step 1: Generate nonce via API
        const nonceRes = await generateNonce(effectiveAddress!)
        if (!isMounted) return

        const currentNonce = nonceRes.data.nonce
        const nonceMsg = `Sign this message to authenticate with Cobalt Protocol.\n\nWallet: ${effectiveAddress!}\nNonce: ${currentNonce}`

        setNonce(currentNonce)
        setNonceMessage(nonceMsg)
        setIsGeneratingNonce(false)

        // Step 2: Sign message using viem along with nonce
        setIsSigningNonceState(true)
        let sig: string
        try {
          sig = await signMessageWithViem(effectiveAddress!, nonceMsg)
        } catch (viemErr: any) {
          const msg = String(viemErr?.message || "").toLowerCase()
          if (viemErr?.code === 4001 || msg.includes("rejected") || msg.includes("user denied")) {
            throw viemErr
          }
          sig = await signMessageAsync({ message: nonceMsg })
        }

        if (!isMounted) return
        setSignature(sig)
        setIsSigningNonceState(false)

        // Step 3: Verify signature & nonce via API
        setIsVerifyingSignature(true)
        const verifyRes = await verifySignature({
          walletAddress: effectiveAddress!,
          signature: sig,
          nonce: currentNonce,
          message: nonceMsg,
        })

        if (!isMounted) return

        if (verifyRes.data?.token) {
          const token = verifyRes.data.token
          const userObj = verifyRes.data.user
          const role = userObj?.role || "user"
          if (typeof window !== "undefined") {
            window.localStorage.setItem("cobalt:access_token", token)
          }
          setSessionToken(token)
          setAuthenticatedAddress(effectiveAddress!)
          setUserRole(role)
          setUser(userObj)
          console.log("Connect wallet berhasil! Session authenticated via viem & API verification for:", effectiveAddress, "Role:", role)
          if (typeof window !== "undefined") {
            window.location.reload()
          }
        } else {
          throw new Error("Verifikasi signature gagal.")
        }
      } catch (err: any) {
        if (!isMounted) return
        console.error("Auth flow failed during wallet connect:", err)
        const errMsg = String(err?.message || "").toLowerCase()
        if (err?.code === 4001 || errMsg.includes("rejected") || errMsg.includes("user denied")) {
          setNotice("Koneksi dompet dibatalkan: Tanda tangan pesan ditolak.")
        } else {
          setNotice(`Gagal verifikasi dompet: ${err?.message || "Kesalahan verifikasi"}`)
        }

        // Abort wallet connection on failure so it doesn't state as connected
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("cobalt:access_token")
        }
        setSessionToken(null)
        setAuthenticatedAddress(null)
        setUserRole(null)
        setUser(null)
        setUserDisconnected(true)
        setDirectAddress(null)
        try {
          await disconnectMetaMaskDirectly()
          if (isWagmiConnected) await disconnectAsync()
        } catch {}
      } finally {
        if (isMounted) {
          setIsGeneratingNonce(false)
          setIsSigningNonceState(false)
          setIsVerifyingSignature(false)
        }
        isAuthInProgressRef.current = false
      }
    }

    performAuthFlow()

    return () => {
      isMounted = false
      isAuthInProgressRef.current = false
    }
  }, [effectiveAddress, userDisconnected, sessionToken, authenticatedAddress, isWagmiConnected, signMessageAsync, disconnectAsync])

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
      if (accs && accs.length > 0 && accs[0]) {
        setDirectAddress(accs[0])
        setSessionConnected(true)
      } else {
        setDirectAddress(null)
        setSessionConnected(false)
      }
    }

    provider.on?.("accountsChanged", handleAccountsChanged)
    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged)
    }
  }, [])

  const profile = user ? mapApiProfileToBuilderProfile(user) : mockProfile
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
      window.localStorage.removeItem("cobalt:access_token")
    }
    setSessionToken(null)
    setAuthenticatedAddress(null)
    setUserRole(null)
    setUser(null)
    setNonce(null)
    setNonceMessage(null)
    setSignature(null)
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
    setSessionConnected(false)
    setDialog(null)
    setNotice(null)

    if (typeof window !== "undefined") {
      window.location.reload()
    }
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
      profileOverride ?? profile
    )
  }
  function continueRegistration(
    competition: RegistrationCompetition,
    walletConnected: boolean,
    currentProfile: BuilderProfile | null
  ) {
    const membership = memberships.find(
      (item) =>
        item.competitionSlug === competition.slug ||
        (competition.id && item.competitionSlug === competition.id) ||
        (competition.id && item.competitionId === competition.id)
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
          ? routes.workspace(competition.id || competition.slug)
          : routes.dashboard
      )
    } else setDialog({ kind: step, competition })
  }
  function joinTeam(
    membership: PreviewMembership,
    redirectTo?: string
  ): string | null {
    if (!connected || !isProfileComplete(profile))
      return "Connect your wallet and complete your profile first."
    if (!addMembership(membership))
      return "Could not save this team. You may already have a team here, or browser storage is unavailable."
    navigate(
      redirectTo ??
        (membership.status === "active"
          ? routes.workspace(membership.competitionId || membership.competitionSlug)
          : routes.dashboard)
    )
    return null
  }
  async function createTeam(input: CreateTeamInput): Promise<string | null> {
    const error = validateCreateTeam(input)
    if (error) return error
    if (dialog?.kind !== "create") return "Reopen the team form to continue."

    const compIdOrSlug = dialog.competition.id || dialog.competition.slug

    const parsedSkills = input.requirements
      ? input.requirements
          .split(/[,;\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : []
    const skillsList = Array.from(
      new Set([...(input.skills || []), ...parsedSkills])
    )

    let teamId = crypto.randomUUID()
    let inviteCode: string | null =
      input.visibility === "private"
        ? `COBALT-${teamId.slice(0, 8).toUpperCase()}`
        : null

    try {
      const res = await createCompetitionTeam(
        compIdOrSlug,
        {
          name: input.name.trim(),
          visibility: input.visibility === "public",
          description: input.requirements.trim(),
          skills: skillsList,
        },
        sessionToken
      )

      if (res?.data) {
        teamId = res.data.id || teamId
        if (res.data.team_code) {
          inviteCode = res.data.team_code
        } else if (Array.isArray(res.data.team_codes) && res.data.team_codes[0]?.code) {
          inviteCode = res.data.team_codes[0].code
        }
      }
    } catch (apiErr: any) {
      console.warn("Backend API create team notice/error:", apiErr?.message)
      if (sessionToken) {
        return apiErr?.message || "Failed to create team on server."
      }
    }

    return joinTeam(
      {
        competitionId: dialog.competition.id,
        competitionSlug: dialog.competition.slug,
        teamId,
        teamName: input.name.trim(),
        visibility: input.visibility,
        requirements: input.requirements.trim(),
        ownerUsername: profile.username,
        role: "lead",
        status: "active",
        inviteCode,
      },
      routes.dashboard
    )
  }
  return (
    <SiteActionsContext.Provider
      value={{
        profile,
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
        nonce,
        nonceMessage,
        isGeneratingNonce,
        signature,
        isSigningNonce,
        sessionToken,
        accessToken: sessionToken,
        userRole,
        user,
        isVerifyingSignature,
        signNonce: async () => {
          let messageToSign = nonceMessage
          let currentNonce = nonce
          if (!messageToSign && effectiveAddress) {
            setIsGeneratingNonce(true)
            try {
              const nonceRes = await generateNonce(effectiveAddress)
              currentNonce = nonceRes.data.nonce
              messageToSign = `Sign this message to authenticate with Cobalt Protocol.\n\nWallet: ${effectiveAddress}\nNonce: ${currentNonce}`
              setNonce(currentNonce)
              setNonceMessage(messageToSign)
            } finally {
              setIsGeneratingNonce(false)
            }
          }
          if (!messageToSign || !effectiveAddress) {
            throw new Error("No nonce message available to sign")
          }
          setIsSigningNonceState(true)
          let sig: string
          try {
            sig = await signMessageWithViem(effectiveAddress, messageToSign)
          } catch (viemErr: any) {
            const msg = String(viemErr?.message || "").toLowerCase()
            if (viemErr?.code === 4001 || msg.includes("rejected") || msg.includes("user denied")) {
              setIsSigningNonceState(false)
              throw viemErr
            }
            sig = await signMessageAsync({ message: messageToSign })
          }
          setSignature(sig)
          setIsSigningNonceState(false)

          if (effectiveAddress) {
            setIsVerifyingSignature(true)
            try {
              const verifyRes = await verifySignature({
                walletAddress: effectiveAddress,
                signature: sig,
                nonce: currentNonce || undefined,
                message: messageToSign,
              })
              if (verifyRes.data?.token) {
                const token = verifyRes.data.token
                const userObj = verifyRes.data.user
                const role = userObj?.role || "user"
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("cobalt:access_token", token)
                }
                setSessionToken(token)
                setAuthenticatedAddress(effectiveAddress)
                setUserRole(role)
                setUser(userObj)
              }
            } catch (err) {
              console.error("Backend signature verification failed:", err)
              throw err
            } finally {
              setIsVerifyingSignature(false)
            }
          }

          return sig
        },
        refetchNonce: async () => {
          if (effectiveAddress) {
            setIsGeneratingNonce(true)
            try {
              const nonceRes = await generateNonce(effectiveAddress)
              const currentNonce = nonceRes.data.nonce
              const nonceMsg = `Sign this message to authenticate with Cobalt Protocol.\n\nWallet: ${effectiveAddress}\nNonce: ${currentNonce}`
              setNonce(currentNonce)
              setNonceMessage(nonceMsg)
              setSignature(null)
            } finally {
              setIsGeneratingNonce(false)
            }
          }
        },
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

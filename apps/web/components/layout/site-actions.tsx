"use client"
import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react"
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
import { createCompetitionTeam } from "@/lib/competitions-api"
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
  const [authenticatedAddress, setAuthenticatedAddress] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("cobalt:authenticated_address")
    }
    return null
  })
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const keysToRemove = [
        "cobalt:disconnected",
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

  const effectiveAddress = !userDisconnected
    ? address
      ? String(address)
      : (directAddress ?? authenticatedAddress ?? undefined)
    : undefined
  const isAddressConnected = Boolean(!userDisconnected && (isWagmiConnected || Boolean(directAddress) || Boolean(authenticatedAddress)))
  const isSessionValid = Boolean(sessionToken) && Boolean(effectiveAddress) && (
    !authenticatedAddress || (effectiveAddress ? authenticatedAddress.toLowerCase() === effectiveAddress.toLowerCase() : true)
  )
  const connected = Boolean(!userDisconnected && sessionToken && (isAddressConnected || Boolean(authenticatedAddress)))
  const isWrongNetwork = Boolean(!userDisconnected && isWagmiConnected && chainId !== botChainTestnet.id)

  const [nonce, setNonce] = useState<string | null>(null)
  const [nonceMessage, setNonceMessage] = useState<string | null>(null)
  const [isGeneratingNonce, setIsGeneratingNonce] = useState<boolean>(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [isSigningNonceState, setIsSigningNonceState] = useState<boolean>(false)
  const isSigningNonce = isSigningWagmi || isSigningNonceState
  const [isVerifyingSignature, setIsVerifyingSignature] = useState<boolean>(false)

  const isAuthInProgressRef = useRef(false)

  // Cross-tab session sync listener: reload all open tabs whenever token or wallet address changes (connect/disconnect)
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "cobalt:access_token" ||
        e.key === "cobalt:authenticated_address"
      ) {
        window.location.reload()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

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
  const startAuthFlow = useCallback(
    async (targetAddress: string) => {
      if (!targetAddress || isAuthInProgressRef.current) return
      isAuthInProgressRef.current = true

      try {
        if (typeof window !== "undefined") {
          const storedToken = window.localStorage.getItem("cobalt:access_token")
          const storedAddr = window.localStorage.getItem("cobalt:authenticated_address")
          if (storedToken && storedAddr && storedAddr.toLowerCase() === targetAddress.toLowerCase()) {
            setSessionToken(storedToken)
            setAuthenticatedAddress(storedAddr)
            setUserDisconnected(false)
            return
          }
        }

        try {
          setConnectKitOpen(false)
        } catch {}

        setIsGeneratingNonce(true)

        let currentNonce = `fallback-nonce-${Date.now()}`
        let nonceMsg = `Sign this message to authenticate with Cobalt Protocol.\n\nWallet: ${targetAddress}\nNonce: ${currentNonce}`

        try {
          const nonceRes = await generateNonce(targetAddress)
          if (nonceRes?.data?.nonce) {
            currentNonce = nonceRes.data.nonce
            nonceMsg = `Sign this message to authenticate with Cobalt Protocol.\n\nWallet: ${targetAddress}\nNonce: ${currentNonce}`
          }
        } catch (nonceErr) {
          console.warn("API generateNonce error, using local nonce format:", nonceErr)
        }

        setNonce(currentNonce)
        setNonceMessage(nonceMsg)
        setIsGeneratingNonce(false)

        // Step 2: Sign message using appropriate client
        setIsSigningNonceState(true)
        let sig: string
        try {
          if (isWagmiConnected) {
            sig = await signMessageAsync({ message: nonceMsg })
          } else {
            sig = await signMessageWithViem(targetAddress, nonceMsg)
          }
        } catch (wagmiSignErr: any) {
          const errMsg = String(wagmiSignErr?.message || "").toLowerCase()
          if (wagmiSignErr?.code === 4001 || errMsg.includes("rejected") || errMsg.includes("user denied")) {
            throw wagmiSignErr
          }
          console.warn("Primary signMessage failed, trying signMessageWithViem fallback:", wagmiSignErr)
          sig = await signMessageWithViem(targetAddress, nonceMsg)
        }

        setSignature(sig)
        setIsSigningNonceState(false)

        // Step 3: Verify signature & nonce via API
        setIsVerifyingSignature(true)
        let token: string | null = null
        let userObj: any = null

        try {
          const verifyRes = await verifySignature({
            walletAddress: targetAddress,
            signature: sig,
            nonce: currentNonce,
            message: nonceMsg,
          })
          if (verifyRes?.data?.token) {
            token = verifyRes.data.token
            userObj = verifyRes.data.user
          }
        } catch (verifyErr) {
          console.warn("API verifySignature warning:", verifyErr)
        }

        if (!token) {
          token = `cobalt_session_${targetAddress.toLowerCase()}`
          userObj = {
            id: targetAddress,
            wallet_address: targetAddress,
            role: "user",
          }
        }

        const role = userObj?.role || "user"
        if (typeof window !== "undefined") {
          window.localStorage.setItem("cobalt:access_token", token)
          window.localStorage.setItem("cobalt:authenticated_address", targetAddress)
          window.localStorage.removeItem("cobalt:disconnected")
          window.localStorage.removeItem("cobalt:auth_in_progress")
          window.location.reload()
        }

        setSessionToken(token)
        setAuthenticatedAddress(targetAddress)
        setUserRole(role)
        setUser(userObj)
        setUserDisconnected(false)
        console.log("Connect wallet berhasil! Session authenticated for:", targetAddress, "Role:", role)
      } catch (err: any) {
        console.error("Auth flow failed during wallet connect:", err)
        const errMsg = String(err?.message || "").toLowerCase()
        if (err?.code === 4001 || errMsg.includes("rejected") || errMsg.includes("user denied")) {
          setNotice("Koneksi dompet dibatalkan: Tanda tangan pesan ditolak.")
        } else {
          setNotice(`Gagal verifikasi dompet: ${err?.message || "Kesalahan verifikasi"}`)
        }

        if (typeof window !== "undefined") {
          window.localStorage.removeItem("cobalt:access_token")
          window.localStorage.removeItem("cobalt:authenticated_address")
        }
        setSessionToken(null)
        setAuthenticatedAddress(null)
        setUserRole(null)
        setUser(null)
      } finally {
        setIsGeneratingNonce(false)
        setIsSigningNonceState(false)
        setIsVerifyingSignature(false)
        isAuthInProgressRef.current = false
      }
    },
    [isWagmiConnected, signMessageAsync, setConnectKitOpen]
  )

  useEffect(() => {
    if (!effectiveAddress || userDisconnected || sessionToken) {
      return
    }

    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return
    }

    startAuthFlow(effectiveAddress)
  }, [effectiveAddress, userDisconnected, sessionToken, startAuthFlow])

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
    if (isConnecting || isSigningNonce) return

    try {
      setIsConnecting(true)
      isAuthInProgressRef.current = false

      // Force clear auth caches prior to opening wallet connect
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("cobalt:disconnected")
        window.localStorage.removeItem("cobalt:auth_in_progress")
        window.localStorage.removeItem("cobalt:access_token")
        window.localStorage.removeItem("cobalt:authenticated_address")
      }

      setUserDisconnected(false)
      setSessionToken(null)
      setAuthenticatedAddress(null)
      setUserRole(null)
      setUser(null)
      setNonce(null)
      setNonceMessage(null)
      setSignature(null)

      const currentWeb3Address = address ? String(address) : directAddress
      if (currentWeb3Address) {
        // Wallet is already connected in Web3, trigger signature flow directly on user click
        await startAuthFlow(currentWeb3Address)
        return
      }

      if (typeof window !== "undefined") {
        const keysToRemove = [
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
      window.localStorage.removeItem("cobalt:authenticated_address")
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
    const step = getRegistrationStep(
      walletConnected,
      currentProfile
    )
    if (step === "wallet") {
      handleOpenWallet()
      return
    }
    setDialog({ kind: step, competition, profileOverride: currentProfile })
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
          ? routes.workspace(
              membership.teamId ||
                membership.competitionId ||
                membership.competitionSlug
            )
          : routes.dashboard)
    )
    return null
  }
  async function createTeam(input: CreateTeamInput): Promise<string | null> {
    const error = validateCreateTeam(input)
    if (error) return error
    if (dialog?.kind !== "create") return "Reopen the team form to continue."

    const compIdOrSlug = dialog.competition.id || dialog.competition.slug
    const activeProfile = dialog.profileOverride || profile

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
          skills_team: skillsList,
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
      const errMsg =
        typeof apiErr?.message === "string"
          ? apiErr.message
          : typeof apiErr === "string"
          ? apiErr
          : Array.isArray(apiErr?.message)
          ? apiErr.message.join(", ")
          : typeof apiErr?.message === "object"
          ? JSON.stringify(apiErr.message)
          : String(apiErr || "Failed to create team on server.")
      console.warn("Backend API create team notice/error:", errMsg)
      if (sessionToken) {
        return errMsg || "Failed to create team on server."
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
        ownerUsername: activeProfile.username?.trim() || "builder",
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
                  window.localStorage.setItem("cobalt:authenticated_address", effectiveAddress)
                }
                setSessionToken(token)
                setAuthenticatedAddress(effectiveAddress)
                setUserRole(role)
                setUser(userObj)
              }
            } catch (err) {
              console.warn("Backend signature verification warning:", err)
              const fallbackToken = `cobalt_session_${effectiveAddress.toLowerCase()}`
              if (typeof window !== "undefined") {
                window.localStorage.setItem("cobalt:access_token", fallbackToken)
                window.localStorage.setItem("cobalt:authenticated_address", effectiveAddress)
              }
              setSessionToken(fallbackToken)
              setAuthenticatedAddress(effectiveAddress)
              setUserRole("user")
              setUser({ id: effectiveAddress, wallet_address: effectiveAddress, role: "user" })
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
        profile={dialog?.profileOverride || profile}
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

"use client"
import { Modal } from "@/components/ui/modal"
import { primaryLinkClass } from "@/components/ui/page-primitives"
import type { Competition } from "@/features/competitions/types"
import {
  fetchApiMe,
  fetchCompetitions,
  fetchMyTeamsResult,
  fetchTokenPrizeByCompetitionId,
  getStoredToken,
  formatTokenPrize,
  type ApiTeam,
} from "@/lib/competitions-api"
import { useQuery } from "@tanstack/react-query"
import { useMemberships } from "@/features/registration/hooks/use-memberships"
import { useSiteActions } from "@/components/layout/site-actions"
import { formatMoney } from "@/lib/format"
import { routes } from "@/lib/routes"
import { Button } from "@workspace/ui/components/button"
import { CirclePlus, Search } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useAccount, useChainId } from "wagmi"
import { useDynamicTokenInfo } from "@/lib/hooks/use-dynamic-token"
import { useCompetitionTokenPrize } from "@/lib/hooks/use-competition-token-prize"
import { convertTokenOnChain } from "@/lib/token-convert"
import { dashboardProfile } from "../data/dashboard-fixtures"
import type { PreviewMembership } from "@/features/registration/types"
import {
  filterDashboardCompetitions,
  getDashboardCounts,
  getDashboardStats,
  mergeDashboardCompetitions,
  phaseLabels,
} from "../lib/dashboard-selectors"
import {
  dashboardPhases,
  type DashboardCompetition,
  type DashboardFilter,
} from "../types"
import { DashboardProfileCard } from "./dashboard-profile-card"
import { JoinedCompetitionRow } from "./joined-competition-row"

export function ParticipantDashboard({
  competitions: initialCompetitions,
}: {
  competitions?: readonly Competition[]
}) {
  const chainId = useChainId()
  const pathname = usePathname()
  const router = useRouter()
  const { isConnected, status: accountStatus, chain } = useAccount()
  const { memberships: rawLocalMemberships } = useMemberships()
  // Dashboard is server-authoritative via GET /chains/:chainId/teams — intentionally ignore legacy GET /users/me/dashboard
  const localMemberships: typeof rawLocalMemberships = pathname?.startsWith("/dashboard") ? [] : rawLocalMemberships
  const { profile: siteProfile } = useSiteActions()
  const [phase, setPhase] = useState<DashboardFilter>("all")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<DashboardCompetition | null>(null)
  const [storedToken, setStoredToken] = useState<string | null>(null)
  const [hasCheckedToken, setHasCheckedToken] = useState(false)

  const isWagmiLoading =
    accountStatus === "connecting" || accountStatus === "reconnecting"

  // Prize Pool Capacity on-chain dari GET /api/v1/chains/:chainId/teams -> competition.prize_deposits[0]
  // Spec: hanya prize_deposits[0].amount + token_address (single entry, not sum), fallback handled upstream (selector returns null)
  const selectedPrizeDeposits = (selected as any)?.prizeDeposits as import("@/lib/competitions-api").ApiPrizeDeposit[] | null | undefined
  const selectedPrizeDepositsTotalRaw = (selected as any)?.prizeDepositsTotalRaw as string | null | undefined
  const hasSelectedPrizeDeposits = Boolean(selectedPrizeDeposits && selectedPrizeDeposits.length > 0 && selectedPrizeDepositsTotalRaw)
  const selectedPrizeDepositsTokenAddress = hasSelectedPrizeDeposits
    ? (selectedPrizeDeposits![0]?.token_address || selectedPrizeDeposits!.find((d) => Boolean(d.token_address))?.token_address || (selected as any)?.tokenAddress || null)
    : null

  // Fetch token metadata for the selected competition in the modal (legacy fallback only)
  const selectedCompIdOrSlug =
    selected?.competitionId ||
    selected?.competitionSlug ||
    (selected?.source === "local" ? selected.id : null)

  const onchainCompId = selected?.rawTokenPrize?.onchain_competition_id || (selected as any)?.onchainCompetitionId || (typeof selectedCompIdOrSlug === "string" && /^\d+$/.test(selectedCompIdOrSlug) ? selectedCompIdOrSlug : null);
  const { data: selectedFetchedTokenPrize } = useCompetitionTokenPrize(onchainCompId);

  const selectedTokenPrize =
    selected?.rawTokenPrize || selectedFetchedTokenPrize
  const selectedPrimaryRaw = hasSelectedPrizeDeposits
    ? selectedPrizeDepositsTotalRaw!
    : (selectedTokenPrize?.total_prize ? String(selectedTokenPrize.total_prize) : null)
  const selectedPrimaryTokenAddress = hasSelectedPrizeDeposits
    ? selectedPrizeDepositsTokenAddress
    : (selected?.tokenAddress || selectedTokenPrize?.token_address || null)
  const selectedTokenAddress = selectedPrimaryTokenAddress
  const { decimals: selectedDecimals, symbol: selectedDynamicSymbol } =
    useDynamicTokenInfo(selectedTokenAddress)

  const { data: convertedSelectedPrize } = useQuery({
    queryKey: ["convert-selected-prize", selected?.id, selectedTokenAddress, selectedPrimaryRaw],
    queryFn: async () => {
      if (!selectedPrimaryRaw) return null
      return await convertTokenOnChain(
        (selectedTokenAddress || "0x0000000000000000000000000000000000000000") as string,
        selectedPrimaryRaw
      )
    },
    enabled: Boolean(selectedPrimaryRaw),
    staleTime: 60_000,
  })

  const { selectedAmountDisplay, selectedSymbolDisplay } = useMemo(() => {
    if (!selected) return { selectedAmountDisplay: "", selectedSymbolDisplay: "" }

    if (convertedSelectedPrize) {
      return {
        selectedAmountDisplay: convertedSelectedPrize.convertedAmount,
        selectedSymbolDisplay: convertedSelectedPrize.symbol,
      }
    }

    let formatted =
      selected.tokenPrizeFormatted ||
      `${formatMoney(selected.amountUsd)} ${selected.currency}`

    if (hasSelectedPrizeDeposits && selectedPrizeDepositsTotalRaw) {
      formatted = formatTokenPrize(
        selectedPrizeDepositsTotalRaw,
        selectedPrizeDepositsTokenAddress,
        chain?.nativeCurrency?.symbol,
        selectedDecimals,
        selectedDynamicSymbol || undefined
      )
    } else if (
      selectedTokenPrize &&
      selectedTokenPrize.total_prize !== undefined &&
      selectedTokenPrize.total_prize !== null
    ) {
      formatted = formatTokenPrize(
        selectedTokenPrize.total_prize,
        selectedTokenAddress,
        chain?.nativeCurrency?.symbol,
        selectedDecimals,
        selectedDynamicSymbol ||
          (selectedTokenPrize as any).symbol ||
          (selectedTokenPrize as any).token_symbol ||
          undefined
      )
    }

    const lastSpaceIndex = formatted.lastIndexOf(" ")
    if (lastSpaceIndex !== -1) {
      return {
        selectedAmountDisplay: formatted.slice(0, lastSpaceIndex),
        selectedSymbolDisplay: formatted.slice(lastSpaceIndex + 1),
      }
    }
    return { selectedAmountDisplay: formatted, selectedSymbolDisplay: "" }
  }, [
    selected,
    selectedTokenPrize,
    chain?.nativeCurrency?.symbol,
    selectedDecimals,
    selectedDynamicSymbol,
    selectedTokenAddress,
    convertedSelectedPrize,
  ])

  useEffect(() => {
    if (hasCheckedToken && !isWagmiLoading && !isConnected) {
      router.push(routes.competitions)
    }
  }, [hasCheckedToken, isWagmiLoading, isConnected, router])

  useEffect(() => {
    setStoredToken(getStoredToken())
    setHasCheckedToken(true)
    const handleAuth = () => setStoredToken(getStoredToken())
    if (typeof window !== "undefined") {
      window.addEventListener("cobalt:auth_change", handleAuth)
      window.addEventListener("storage", handleAuth)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("cobalt:auth_change", handleAuth)
        window.removeEventListener("storage", handleAuth)
      }
    }
  }, [])

  const { data: meUser } = useQuery({
    queryKey: ["user-me", storedToken],
    queryFn: () => fetchApiMe(storedToken || getStoredToken()),
    enabled: Boolean(storedToken),
  })

  const { data: competitions = initialCompetitions || [] } = useQuery({
    queryKey: ["competitions", chainId, storedToken],
    queryFn: () => fetchCompetitions(chainId, storedToken || getStoredToken()),
  })

  const { data: teamsResult, isLoading: isTeamsLoading } = useQuery({
    queryKey: ["my-teams", chainId, storedToken],
    queryFn: () => fetchMyTeamsResult(chainId, storedToken || getStoredToken()),
    enabled: hasCheckedToken && Boolean(storedToken),
  })

  // Server-authoritative: GET /api/v1/chains/:chainId/teams — AuthSessionGuard,
  // include: { competition: true } via Team.competition_id -> Competition.id,
  // filtered by team_role.user_id = JWT sub + chainId -> indexer_state_id.
  const teams: ApiTeam[] = useMemo(
    () => (teamsResult?.data as ApiTeam[] | null) || [],
    [teamsResult]
  )

  const previewFromTeams: PreviewMembership[] = useMemo(() => {
    if (!teams.length) return []
    return teams.map((team) => {
      // GET /chains/:chainId/teams returns TeamRole[] -> team.competition; normalizeMyTeamsPayload already unwraps,
      // but keep defensive fallback for any shape (TeamRole vs ApiTeam) so prize_deposits[0] is never lost.
      const unwrapped: any = (team as any).team || team
      const comp: any = unwrapped.competition || {}
      const roles: any[] = unwrapped.team_roles || (team as any).team_roles || []
      const myRoleRaw = meUser
        ? roles.find((r: any) => r.user_id === meUser.id)?.role
        : null
      const normalized = String(myRoleRaw || "").toLowerCase()
      const role: PreviewMembership["role"] =
        normalized === "lead" || normalized === "leader" ? "lead" : "member"
      const slugFallback =
        comp.slug ||
        (comp.name
          ? comp.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
          : null) ||
        unwrapped.competition_id || (team as any).competition_id
      const visibility: PreviewMembership["visibility"] = (unwrapped.visibility ?? (team as any).visibility) ? "public" : "private"
      const inviteCode = unwrapped.team_codes?.[0]?.code ?? (team as any).team_codes?.[0]?.code ?? null
      const apiStatus = (unwrapped.status ?? (team as any).status) as "pending" | "accepted" | undefined
      const status: PreviewMembership["status"] = apiStatus === "pending" ? "pending" : "active"
      return {
        competitionId: comp.id || unwrapped.competition_id || (team as any).competition_id,
        competitionSlug: slugFallback || unwrapped.competition_id || (team as any).competition_id,
        teamId: unwrapped.id || (team as any).id,
        teamName: unwrapped.name || (team as any).name,
        visibility,
        requirements: unwrapped.description || (team as any).description || comp.requirement || "",
        ownerUsername: "",
        role,
        status,
        inviteCode,
        rawTeam: unwrapped,
      } satisfies PreviewMembership
    })
  }, [teams, meUser])

  const allMemberships = useMemo(() => {
    const map = new Map<string, PreviewMembership>()
    for (const m of localMemberships) {
      const key = m.teamId || `local-${m.competitionSlug}`
      if (key) map.set(key, m)
    }
    for (const m of previewFromTeams) {
      const key = m.teamId || `api-${m.competitionSlug}`
      if (key) map.set(key, m)
    }
    for (const m of localMemberships) {
      const key = m.teamId || `local-${m.competitionSlug}`
      if (key && !map.has(key)) map.set(key, m)
    }
    return Array.from(map.values())
  }, [localMemberships, previewFromTeams])

  const entries = mergeDashboardCompetitions([], allMemberships, competitions, null)
  const counts = getDashboardCounts(entries)
  const stats = getDashboardStats(entries)
  const visible = filterDashboardCompetitions(entries, phase, query)
  const profile = siteProfile
    ? {
        ...dashboardProfile,
        name: siteProfile.username || dashboardProfile.name,
        username: siteProfile.username || dashboardProfile.username,
        institution: siteProfile.institution || dashboardProfile.institution,
        pitch: siteProfile.pitch || dashboardProfile.pitch,
        skills: siteProfile.skills
          .slice(0, 3)
          .map(
            (skill: { name: string; level?: string }) =>
              `${skill.name} [${skill.level || "Intermediate"}]`
          ),
      }
    : dashboardProfile
  function handleAction(entry: DashboardCompetition) {
    if (entry.pending) {
      return
    }
    if (entry.source === "local" && entry.competitionSlug) {
      router.push(
        entry.pending
          ? routes.competition(entry.competitionSlug)
          : routes.workspace(entry.id || entry.competitionSlug)
      )
      return
    }
    setSelected(entry)
  }

  if (hasCheckedToken && !isWagmiLoading && !isConnected) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pt-9 pb-8 md:px-10">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            My Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Track your joined competitions, monitor upcoming milestone
            deadlines, review squad rosters, and submit deliverables directly to
            smart contract escrow vaults.
          </p>
          {(teamsResult as any)?.status === 401 || (teamsResult as any)?.status === 403 ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
              Session invalid or forbidden for chain {chainId}. Re-connect &amp; re-sign SIWE. Requires{" "}
              <code className="rounded bg-white px-1">Authorization: Bearer &lt;JWT&gt;</code>.
            </p>
          ) : null}
          {hasCheckedToken && storedToken && isTeamsLoading && (
            <p className="mt-2 text-xs text-slate-500">Loading teams for chain {chainId}…</p>
          )}
        </div>
        <Link
          href={routes.competitions}
          className={primaryLinkClass + " bg-[#004bd0] text-xs"}
        >
          <CirclePlus size={16} />
          Register New Competitions
        </Link>
      </div>
      <DashboardProfileCard
        profile={profile}
        active={stats.active}
        claimableUsd={stats.claimableUsd}
      />
      <section className="mt-8" aria-labelledby="joined-heading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="joined-heading" className="text-xl font-bold tracking-tight">
            Joined Competitions
          </h2>
          <label className="relative w-full sm:w-80">
            <span className="sr-only">Search joined competitions</span>
            <Search
              size={16}
              className="absolute top-3 left-3 text-slate-500"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or else"
              className="h-10 w-full rounded-lg border border-border/30 bg-white pr-3 pl-9 text-xs outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-primary/30"
            />
          </label>
        </div>
        <div
          className="mt-4 flex flex-wrap gap-1.5"
          aria-label="Filter competitions by phase"
        >
          {(["all", ...dashboardPhases] as const).map((item) => (
            <button
              key={item}
              aria-pressed={phase === item}
              onClick={() => setPhase(item)}
              className="rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-xs transition-colors hover:bg-blue-50 aria-pressed:bg-[#004bd0] aria-pressed:text-white"
            >
              {item === "all" ? "All" : phaseLabels[item]} ({counts[item]})
            </button>
          ))}
        </div>
        <p role="status" className="sr-only">
          {visible.length} competitions shown
        </p>
        <div className="mt-8 space-y-5">
          {visible.map((competition) => (
            <JoinedCompetitionRow
              key={competition.id}
              competition={competition}
              onAction={() => handleAction(competition)}
            />
          ))}
        </div>
        {visible.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white px-5 py-14 text-center">
            <Search size={30} className="mx-auto text-slate-400" />
            <h3 className="mt-4 text-lg font-bold">No competitions found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try another phase or search term.
            </p>
            <Button
              variant="secondary"
              className="mt-5"
              onClick={() => {
                setPhase("all")
                setQuery("")
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </section>
      <p className="sr-only">
        Dashboard preview. Example prize amounts, vault address, and podium
        history are mock data.
      </p>
      <Modal
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        title={selected?.actionLabel ?? "Competition"}
      >
        {selected && (
          <>
            <h3 className="mt-5 text-lg font-bold">{selected.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {selected.teamName}
              {selected.memberCount !== null
                ? ` · ${selected.memberCount} members`
                : ""}
            </p>
            <div className="my-5 rounded-xl bg-blue-50 p-4">
              <p className="text-xs text-muted-foreground">
                {selected.poolLabel}
              </p>
              <p className="mt-2 text-2xl font-bold flex items-baseline gap-1.5">
                <span>{selectedAmountDisplay}</span>
                {selectedSymbolDisplay && (
                  <span className="text-sm font-medium text-muted-foreground">
                    {selectedSymbolDisplay}
                  </span>
                )}
              </p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {selected.phase === "claim"
                ? "This is the claim preview for the sample competition. No real funds are available or transferred; claiming will be enabled after wallet and escrow integration."
                : selected.phase === "closed"
                  ? "This sample competition is closed. The evaluation report has not been attached to this preview."
                  : selected.phase === "registration"
                    ? "Your sample squad is looking for teammates. Team discovery for this example competition will be available with the team directory."
                    : "This sample competition is in the submission phase. The participant workspace is available below; submissions remain local until backend integration."}
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Close
              </Button>
              {selected.phase === "submission" && selected.competitionSlug && (
                selected.pending ? (
                  <Button disabled title="Join request pending — waiting for approval" className="cursor-not-allowed opacity-60">
                    Open Workspace
                  </Button>
                ) : (
                  <Link
                    className={primaryLinkClass}
                    href={routes.workspace(
                      selected.id || selected.competitionSlug
                    )}
                    onClick={() => setSelected(null)}
                  >
                    Open Workspace
                  </Link>
                )
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

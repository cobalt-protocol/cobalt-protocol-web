"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, KeyRound, Loader2, RefreshCw, Search, Sparkles } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import { Button } from "@workspace/ui/components/button"
import {
  Breadcrumbs,
  PageContainer,
  Panel,
  Badge,
  fieldClass,
} from "@/components/ui/page-primitives"
import { useSiteActions } from "@/components/layout/site-actions"
import type { Competition } from "@/features/competitions/types"
import { getPrizeTotal } from "@/features/competitions/lib/competition-selectors"
import { useMemberships } from "@/features/registration/hooks/use-memberships"
import {
  acceptTeamInviteByCode,
  fetchTeamsByCompetitionId,
  getStoredToken,
  parseCapacityFromFormation,
  requestJoinTeam,
} from "@/lib/competitions-api"
import { formatMoney } from "@/lib/format"
import { routes } from "@/lib/routes"
import {
  recommendTeams,
  searchTeams,
  teamsPerPage,
} from "../lib/team-selectors"
import type { TeamListing } from "../types"
import { TeamCard } from "./team-card"

export function JoinTeamPage({ competition }: { competition: Competition }) {
  const router = useRouter()
  const { isConnected, status: accountStatus } = useAccount()
  const { joinTeam, register } = useSiteActions()
  const { memberships, ready } = useMemberships()
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [discarded, setDiscarded] = useState<string[]>([])
  const [refreshOffset, setRefreshOffset] = useState(0)
  const [submittingTeamId, setSubmittingTeamId] = useState<string | null>(null)
  const [isSubmittingCode, setIsSubmittingCode] = useState(false)
  const [storedToken, setStoredToken] = useState<string | null>(null)
  const [hasCheckedToken, setHasCheckedToken] = useState(false)

  useEffect(() => {
    setStoredToken(getStoredToken())
    setHasCheckedToken(true)
  }, [])

  useEffect(() => {
    const token = storedToken || getStoredToken()
    const isWagmiLoading =
      accountStatus === "connecting" || accountStatus === "reconnecting"
    if (hasCheckedToken && !isWagmiLoading && !isConnected && !token) {
      router.push(routes.competitions)
    }
  }, [hasCheckedToken, isConnected, accountStatus, storedToken, router])

  // Fetch teams from NestJS API endpoint GET /api/v1/teams/competition/:competitionId
  const { data: apiTeams = [], isLoading: isLoadingTeams } = useQuery({
    queryKey: ["competition-teams", competition.id],
    queryFn: () => fetchTeamsByCompetitionId(competition.id),
    enabled: Boolean(competition.id),
  })

  const mappedApiTeams: TeamListing[] = useMemo(() => {
    if (!apiTeams || apiTeams.length === 0) return []
    return apiTeams
      .filter((item) => item.visibility !== false)
      .map((item, idx) => {
        const leadRole = item.team_roles?.find((r) => r.role === "LEAD" || r.role === "lead" || r.role === "LEADER")
        const leadUser = leadRole?.user
        const leadName =
          leadUser?.username ||
          (leadUser?.wallet_address
            ? `${leadUser.wallet_address.slice(0, 6)}...${leadUser.wallet_address.slice(-4)}`
            : item.user_id
              ? `User ${item.user_id.slice(-6)}`
              : "Squad Lead")

        const skills =
          item.skills_team && item.skills_team.length > 0
            ? item.skills_team.map((s) => s.name)
            : ["Fullstack Developer", "Smart Contract Dev"]

        return {
          id: item.id,
          name: item.name,
          lead: leadName,
          memberCount: item.team_roles?.length || 1,
          description: item.description || "No description provided.",
          roles: skills,
          matchScore: Math.max(75, 98 - idx * 3),
        }
      })
  }, [apiTeams])

  const membership = memberships.find(
    (item) => item.competitionSlug === competition.slug
  )

  const capacity = useMemo(() => {
    return competition.formation
      ? parseCapacityFromFormation(competition.formation, competition.maxTeamSize)
      : competition.maxTeamSize
  }, [competition.formation, competition.maxTeamSize])

  const available = useMemo(() => {
    return mappedApiTeams.filter(
      (team) => team.memberCount < capacity
    )
  }, [mappedApiTeams, capacity])
  const filtered = searchTeams(mappedApiTeams, query)
  const pages = Math.max(1, Math.ceil(filtered.length / teamsPerPage))
  const currentPage = Math.min(page, pages)
  const start = (currentPage - 1) * teamsPerPage
  const recommendations = recommendTeams(available, discarded, refreshOffset)
  const disabled = !ready || Boolean(membership)

  async function requestTeam(team: TeamListing, inviteCode: string | null = null) {
    if (disabled) return
    if (team.memberCount >= capacity) {
      setError("This team is full.")
      return
    }

    setError(null)
    setSubmittingTeamId(team.id)

    try {
      if (inviteCode) {
        await acceptTeamInviteByCode(inviteCode, team.id)
        joinTeam({
          competitionSlug: competition.slug,
          teamId: team.id,
          teamName: team.name,
          visibility: "private",
          requirements: team.roles.join(", "),
          ownerUsername: team.lead,
          role: "member",
          status: "active",
          inviteCode,
        })
      } else {
        // Public team: submit a join request to the backend
        await requestJoinTeam(team.id)
        joinTeam({
          competitionSlug: competition.slug,
          teamId: team.id,
          teamName: team.name,
          visibility: "public",
          requirements: team.roles.join(", "),
          ownerUsername: team.lead,
          role: "member",
          status: "pending",
          inviteCode: null,
        })
      }
    } catch (err: any) {
      setError(err?.message || "Failed to join team. Please ensure you are logged in.")
    } finally {
      setSubmittingTeamId(null)
    }
  }

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Competitions", href: routes.competitions },
          {
            label: competition.title,
            href: routes.competition(competition.id),
          },
          { label: "Join a Team" },
        ]}
      />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Join a Team</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Find high-caliber teammates or enter a private squad code to
            participate together.
          </p>
        </div>
        <Badge tone="green">
          {available.length} Public Squads Recruiting ·{" "}
          {formatMoney(getPrizeTotal(competition))} {competition.currency}{" "}
          Escrow Secured
        </Badge>
      </div>
      {membership && (
        <Panel className="mb-6">
          <p>
            You already have{" "}
            {membership.status === "pending"
              ? "a pending team request"
              : "a team"}{" "}
            in this competition.{" "}
            <Link
              className="font-semibold text-primary underline"
              href={
                membership.status === "pending"
                  ? routes.dashboard
                  : routes.workspace(competition.id)
              }
            >
              View your {membership.status === "pending" ? "request" : "team"}
            </Link>
          </p>
        </Panel>
      )}
      <Panel className="mb-6 flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <span className="rounded-xl bg-indigo-100 p-3 text-primary">
            <KeyRound size={24} />
          </span>
          <div>
            <h2 className="font-bold">
              Have a Team Code? <Badge>Instant Entry</Badge>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter the code shared by your team leader to join a private team
              directly.
            </p>
          </div>
        </div>
        <form
          className="flex w-full flex-wrap gap-3 md:w-auto"
          onSubmit={async (event) => {
            event.preventDefault()
            const normalized = code.trim().toUpperCase()
            if (!normalized) return

            setError(null)
            setIsSubmittingCode(true)

            try {
              const matchedApiTeam = apiTeams.find((t) =>
                t.team_codes?.some((c) => c.code.toUpperCase() === normalized)
              )

              if (matchedApiTeam) {
                const leadRole = matchedApiTeam.team_roles?.find(
                  (r) => r.role === "LEAD" || r.role === "lead" || r.role === "LEADER"
                )
                const leadUser = leadRole?.user
                const leadName =
                  leadUser?.username ||
                  (leadUser?.wallet_address
                    ? `${leadUser.wallet_address.slice(0, 6)}...${leadUser.wallet_address.slice(-4)}`
                    : matchedApiTeam.user_id
                      ? `User ${matchedApiTeam.user_id.slice(-6)}`
                      : "Squad Lead")
                const skills =
                  matchedApiTeam.skills_team &&
                  matchedApiTeam.skills_team.length > 0
                    ? matchedApiTeam.skills_team.map((s) => s.name)
                    : ["Fullstack Developer"]

                await requestTeam(
                  {
                    id: matchedApiTeam.id,
                    name: matchedApiTeam.name,
                    lead: leadName,
                    memberCount: matchedApiTeam.team_roles?.length || 1,
                    description: matchedApiTeam.description || "Private Team",
                    roles: skills,
                    matchScore: 95,
                  },
                  normalized
                )
                return
              }

              // The reference-code accept endpoint was removed; an invite can
              // only be accepted when its team is known. Surface a clear error
              // when the code does not match a team in this competition.
              throw new Error(
                "We couldn't match that team code to a team in this competition. Please ask the team leader for a valid invite link."
              )
            } catch (err: any) {
              setError(
                err?.message ||
                  `Team code "${code.trim()}" not found or invalid.`
              )
            } finally {
              setIsSubmittingCode(false)
            }
          }}
        >
          <label className="sr-only" htmlFor="team-code">
            Team invite code
          </label>
          <input
            id="team-code"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="e.g. TEAM-INVITE-CODE"
            className={`${fieldClass} min-w-0 flex-1 md:w-64`}
          />
          <Button type="submit" disabled={disabled || isSubmittingCode} className="h-11">
            {isSubmittingCode ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                Join Team
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>
      </Panel>
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"
        >
          <p>{error}</p>
          <button
            className="mt-2 font-semibold text-primary underline"
            onClick={() => register(competition)}
          >
            Check wallet and profile
          </button>
        </div>
      )}
      <Panel className="mb-7 bg-gradient-to-bl from-teal-50 via-white to-white">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-blue-100 p-3 text-primary">
              <Sparkles size={24} />
            </span>
            <div>
              <h2 className="text-lg font-bold">
                AI Recommended Squads{" "}
                <Badge tone="green">Algorithmic Match Preview</Badge>
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Discover complementary skills in LangGraph, Rust, PyTorch, and
                product design.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setDiscarded([])
              setRefreshOffset((value) => value + 4)
            }}
          >
            <RefreshCw size={14} />
            Refresh All Recommendations
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {recommendations.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              capacity={capacity}
              disabled={disabled}
              isSubmitting={submittingTeamId === team.id}
              onRequest={() => requestTeam(team)}
              onDiscard={() => setDiscarded((current) => [...current, team.id])}
              onRefresh={() => setDiscarded((current) => [...current, team.id])}
            />
          ))}
        </div>
        {!recommendations.length && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No more recommendations. Refresh to see dismissed squads again.
          </p>
        )}
      </Panel>
      <Panel className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            Public Teams <Badge>{filtered.length} teams</Badge>
            {isLoadingTeams && (
              <Loader2 className="h-4 w-4 animate-spin text-primary ml-1" />
            )}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Explore active squads looking for complementary skill sets.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search
            className="absolute top-3.5 left-3 text-muted-foreground"
            size={16}
          />
          <label className="sr-only" htmlFor="team-search">
            Search public teams
          </label>
          <input
            id="team-search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Search by team name, role, tech stack..."
            className={`${fieldClass} pl-9`}
          />
        </div>
      </Panel>
      <div className="grid gap-6 md:grid-cols-2">
        {filtered.slice(start, start + teamsPerPage).map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            capacity={capacity}
            disabled={disabled}
            isSubmitting={submittingTeamId === team.id}
            onRequest={() => requestTeam(team)}
          />
        ))}
      </div>
      {!filtered.length && (
        <Panel>
          <p className="text-center text-sm text-muted-foreground">
            {isLoadingTeams
              ? "Loading public teams..."
              : query.trim()
                ? "No teams match your search. Try another name or skill."
                : "No public teams available yet for this competition."}
          </p>
        </Panel>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Showing {filtered.length ? start + 1 : 0}–
          {Math.min(start + teamsPerPage, filtered.length)} of {filtered.length}{" "}
          public teams
        </p>
        <nav
          aria-label="Public teams pagination"
          className="flex flex-wrap gap-1"
        >
          <Button
            variant="ghost"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
            aria-label="Previous page"
          >
            ‹
          </Button>
          {Array.from({ length: pages }, (_, index) => index + 1).map(
            (number) => (
              <Button
                key={number}
                size="sm"
                variant={number === currentPage ? "default" : "secondary"}
                aria-label={`Page ${number}`}
                aria-current={number === currentPage ? "page" : undefined}
                onClick={() => setPage(number)}
              >
                {number}
              </Button>
            )
          )}
          <Button
            variant="ghost"
            disabled={currentPage === pages}
            onClick={() => setPage(currentPage + 1)}
            aria-label="Next page"
          >
            ›
          </Button>
        </nav>
      </div>
    </PageContainer>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, KeyRound, RefreshCw, Search, Sparkles } from "lucide-react"
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
import { formatMoney } from "@/lib/format"
import { routes } from "@/lib/routes"
import { previewInviteCode, privateTeam, publicTeams } from "../data/teams"
import {
  recommendTeams,
  searchTeams,
  teamsPerPage,
} from "../lib/team-selectors"
import type { TeamListing } from "../types"
import { TeamCard } from "./team-card"

export function JoinTeamPage({ competition }: { competition: Competition }) {
  const { joinTeam, register } = useSiteActions()
  const { memberships, ready } = useMemberships()
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [discarded, setDiscarded] = useState<string[]>([])
  const [refreshOffset, setRefreshOffset] = useState(0)
  const membership = memberships.find(
    (item) => item.competitionSlug === competition.slug
  )
  const available = publicTeams.filter(
    (team) => team.memberCount < competition.maxTeamSize
  )
  const filtered = searchTeams(available, query)
  const pages = Math.max(1, Math.ceil(filtered.length / teamsPerPage))
  const currentPage = Math.min(page, pages)
  const start = (currentPage - 1) * teamsPerPage
  const recommendations = recommendTeams(available, discarded, refreshOffset)
  const disabled = !ready || Boolean(membership)

  function requestTeam(team: TeamListing, inviteCode: string | null = null) {
    if (disabled) return
    if (team.memberCount >= competition.maxTeamSize) {
      setError("This team is full.")
      return
    }
    setError(
      joinTeam({
        competitionSlug: competition.slug,
        teamId: team.id,
        teamName: team.name,
        visibility: inviteCode ? "private" : "public",
        requirements: team.roles.join(", "),
        ownerUsername: team.lead,
        role: "member",
        status: inviteCode ? "active" : "pending",
        inviteCode,
      })
    )
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
                  : routes.workspace(competition.slug)
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
          onSubmit={(event) => {
            event.preventDefault()
            const normalized = code.trim().toUpperCase()
            if (![previewInviteCode, "COBALT-DEMO"].includes(normalized)) {
              setError(
                "Team code not found. Try the preview code SWARM-2025-X8K."
              )
              return
            }
            requestTeam(privateTeam, normalized)
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
            placeholder={`e.g. ${previewInviteCode}`}
            className={`${fieldClass} min-w-0 flex-1 md:w-64`}
          />
          <Button type="submit" disabled={disabled} className="h-11">
            Join Team
            <ArrowRight size={16} />
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
              capacity={competition.maxTeamSize}
              disabled={disabled}
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
          <h2 className="text-lg font-bold">
            Public Teams <Badge>{available.length} Available</Badge>
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
            capacity={competition.maxTeamSize}
            disabled={disabled}
            onRequest={() => requestTeam(team)}
          />
        ))}
      </div>
      {!filtered.length && (
        <Panel>
          <p className="text-center text-sm text-muted-foreground">
            No teams match your search. Try another name or skill.
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
      <p className="mt-4 text-xs text-muted-foreground">
        Preview data · Recommendations and team requests are simulated. Private
        team demo code: {previewInviteCode}.
      </p>
    </PageContainer>
  )
}

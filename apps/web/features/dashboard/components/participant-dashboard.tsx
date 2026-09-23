"use client"
import { Modal } from "@/components/ui/modal"
import { primaryLinkClass } from "@/components/ui/page-primitives"
import type { Competition } from "@/features/competitions/types"
import { fetchCompetitions } from "@/lib/competitions-api"
import { useQuery } from "@tanstack/react-query"
import {
  isBuilderProfile,
  profileStorageKey,
} from "@/features/profile/data/profile"
import type { BuilderProfile } from "@/features/profile/types"
import { useMemberships } from "@/features/registration/hooks/use-memberships"
import { useBrowserDraft } from "@/lib/browser-draft"
import { formatMoney } from "@/lib/format"
import { routes } from "@/lib/routes"
import { Button } from "@workspace/ui/components/button"
import { CirclePlus, Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  dashboardCompetitions,
  dashboardProfile,
} from "../data/dashboard-fixtures"
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

const isOptionalProfile = (value: unknown): value is BuilderProfile | null =>
  value === null || isBuilderProfile(value)

export function ParticipantDashboard({
  competitions: initialCompetitions,
}: {
  competitions?: readonly Competition[]
}) {
  const { data: competitions = initialCompetitions || [] } = useQuery({
    queryKey: ["competitions"],
    queryFn: fetchCompetitions,
  })
  const router = useRouter()
  const { memberships } = useMemberships()
  const { value: savedProfile } = useBrowserDraft<BuilderProfile | null>(
    profileStorageKey,
    null,
    isOptionalProfile
  )
  const [phase, setPhase] = useState<DashboardFilter>("all")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<DashboardCompetition | null>(null)
  const entries = mergeDashboardCompetitions(
    dashboardCompetitions,
    memberships,
    competitions
  )
  const counts = getDashboardCounts(entries)
  const stats = getDashboardStats(entries)
  const visible = filterDashboardCompetitions(entries, phase, query)
  const profile = savedProfile
    ? {
        ...dashboardProfile,
        name:
          savedProfile.username === dashboardProfile.username
            ? dashboardProfile.name
            : savedProfile.username,
        username: savedProfile.username,
        institution: savedProfile.institution,
        pitch: savedProfile.pitch,
        skills: savedProfile.skills
          .slice(0, 3)
          .map((skill) => `${skill.name} [${skill.level}]`),
      }
    : dashboardProfile
  function handleAction(entry: DashboardCompetition) {
    if (entry.source === "local" && entry.competitionSlug) {
      router.push(
        entry.pending
          ? routes.competition(entry.competitionSlug)
          : routes.workspace(entry.competitionSlug)
      )
      return
    }
    setSelected(entry)
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
              <p className="mt-2 text-2xl font-bold">
                {formatMoney(selected.amountUsd)} {selected.currency}
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
                <Link
                  className={primaryLinkClass}
                  href={routes.workspace(selected.competitionSlug)}
                  onClick={() => setSelected(null)}
                >
                  Open Workspace
                </Link>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

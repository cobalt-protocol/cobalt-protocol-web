"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import {
  fetchTeamCompetitionDetailResult,
  fetchTeamMembersResult,
  getStoredToken,
  mapApiCompetitionToCompetition,
} from "@/lib/competitions-api"
import {
  Breadcrumbs,
  PageContainer,
  Panel,
} from "@/components/ui/page-primitives"
import { CompetitionOverview } from "@/features/competitions/components/competition-overview"
import { CompetitionTimeline } from "@/features/competitions/components/competition-timeline"
import type { Competition } from "@/features/competitions/types"
import { routes } from "@/lib/routes"
import { SubmissionForm } from "./submission-form"
import { RegisteredTeam } from "./registered-team"
import { IncomingJoinRequests } from "./incoming-join-requests"
import { WorkspaceAnnouncements } from "./workspace-announcements"

export function CompetitionWorkspace({
  competition: initialCompetition,
  teamId,
}: {
  competition?: Competition
  teamId?: string
}) {
  const router = useRouter()
  const { isConnected, status: accountStatus } = useAccount()

  // Token sesi disimpan di localStorage (client-only). Baca dulu sebelum
  // memutuskan redirect, karena saat hard refresh wagmi sempat berstatus
  // "disconnected" sesaat sebelum proses reconnect selesai.
  const [storedToken, setStoredToken] = useState<string | null>(null)
  const [hasCheckedToken, setHasCheckedToken] = useState(false)

  useEffect(() => {
    setStoredToken(getStoredToken())
    setHasCheckedToken(true)
  }, [])

  useEffect(() => {
    const isWagmiLoading =
      accountStatus === "connecting" || accountStatus === "reconnecting"
    // Jangan redirect selama token sesi masih tersimpan (wallet sedang
    // reconnect), dan jangan putuskan apa pun sebelum token selesai dibaca.
    if (hasCheckedToken && !isWagmiLoading && !isConnected && !storedToken) {
      router.push(routes.competitions)
    }
  }, [hasCheckedToken, isConnected, accountStatus, storedToken, router])

  const {
    data: teamCompResult,
    isFetched: isCompFetched,
    isLoading: isCompLoading,
  } = useQuery({
    queryKey: ["team-competition", teamId],
    queryFn: () => (teamId ? fetchTeamCompetitionDetailResult(teamId) : null),
    enabled: Boolean(teamId),
  })

  const {
    data: teamMembersResult,
    isFetched: isMembersFetched,
  } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: () => (teamId ? fetchTeamMembersResult(teamId) : null),
    enabled: Boolean(teamId),
  })

  useEffect(() => {
    if (!isCompFetched && !isMembersFetched) return
    if (
      teamCompResult?.status === 404 ||
      teamCompResult?.status === 401 ||
      teamCompResult?.status === 403 ||
      (isCompFetched && !teamCompResult?.data) ||
      teamMembersResult?.status === 404 ||
      teamMembersResult?.status === 403
    ) {
      router.push(routes.competitions)
    }
  }, [isCompFetched, isMembersFetched, teamCompResult, teamMembersResult, router])

  const fetchedComp = teamCompResult?.data?.competition
    ? mapApiCompetitionToCompetition(teamCompResult.data.competition)
    : null

  const competition = fetchedComp || initialCompetition

  if (isCompLoading && !competition) {
    return (
      <PageContainer>
        <Panel>
          <p role="status" className="text-sm text-slate-500">
            Loading competition workspace...
          </p>
        </Panel>
      </PageContainer>
    )
  }

  if (isCompFetched && !competition) {
    router.replace("/competition")
    return null
  }

  if (!competition) {
    router.replace("/competition")
    return null
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
          { label: "My Competition" },
        ]}
      />
      <div className="space-y-5">
        <CompetitionOverview competition={competition} workspace />
        <CompetitionTimeline stages={competition.timeline} />
        <RegisteredTeam
          competitionSlug={competition.slug}
          capacity={competition.maxTeamSize}
          formation={competition.formation}
          teamId={teamId}
        />
        <IncomingJoinRequests teamId={teamId} />
        <SubmissionForm competitionId={competition.id} teamId={teamId} />
        <WorkspaceAnnouncements
          competitionId={competition.id}
          onchainCompetitionId={competition.onchainCompetitionId}
          certificateCid={competition.certificate_cid}
          pirzeCertificateClaim={competition.pirze_certificate_claim}
          teamId={teamId}
        />
      </div>
    </PageContainer>
  )
}

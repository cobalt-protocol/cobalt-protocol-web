"use client"
import { useEffect, useState } from "react"
import { useMemberships } from "@/features/registration/hooks/use-memberships"
import { Badge, Panel, SectionHeading } from "@/components/ui/page-primitives"
import { TeamManagement } from "./team-management"
import { useSiteActions } from "@/components/layout/site-actions"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  fetchApiMe,
  fetchTeamDetail,
  getStoredToken,
  parseCapacityFromFormation,
  updateTeamApi,
} from "@/lib/competitions-api"

export function RegisteredTeam({
  competitionSlug,
  capacity,
  formation,
  teamId,
}: {
  competitionSlug: string
  capacity: number
  formation?: string
  teamId?: string
}) {
  const [mounted, setMounted] = useState(false)
  const { memberships, ready, renameTeam, reloadMemberships } = useMemberships()
  const { profile, connected } = useSiteActions()
  const queryClient = useQueryClient()

  const [storedToken, setStoredToken] = useState<string | null>(null)
  useEffect(() => {
    setMounted(true)
    setStoredToken(getStoredToken())
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

  const membership = memberships.find(
    (item) =>
      (teamId && item.teamId === teamId) ||
      item.competitionSlug === competitionSlug
  )

  const effectiveTeamId = teamId || membership?.teamId

  const { data: apiTeam, isLoading: isLoadingApiTeam } = useQuery({
    queryKey: ["team-detail", effectiveTeamId],
    queryFn: () => (effectiveTeamId ? fetchTeamDetail(effectiveTeamId) : null),
    enabled: Boolean(effectiveTeamId),
  })

  const { data: meUser } = useQuery({
    queryKey: ["user-me", storedToken],
    queryFn: () => (storedToken ? fetchApiMe(storedToken) : null),
    enabled: Boolean(storedToken),
  })

  const isLeader = Boolean(
    apiTeam && meUser
      ? apiTeam.user_id === meUser.id ||
        apiTeam.team_roles?.some(
          (tr: any) =>
            (tr.user_id === meUser.id || tr.user?.id === meUser.id) &&
            (tr.role === "LEAD" || tr.role === "LEADER" || tr.role === "lead")
        )
      : membership
      ? membership.role === "lead"
      : true
  )

  const handleUpdateTeam = async (payload: {
    name?: string
    description?: string
    visibility?: boolean
    skills_team?: string[]
  }) => {
    if (!effectiveTeamId) {
      if (payload.name) renameTeam(competitionSlug, payload.name)
      return { success: true }
    }

    const res = await updateTeamApi(effectiveTeamId, payload, storedToken)
    if (res.success) {
      if (payload.name) {
        renameTeam(competitionSlug, payload.name)
      }
      queryClient.invalidateQueries({ queryKey: ["team-detail", effectiveTeamId] })
      queryClient.invalidateQueries({ queryKey: ["team-competition", effectiveTeamId] })
      reloadMemberships()
      return { success: true }
    } else {
      return { success: false, error: res.error || "Failed to update team profile" }
    }
  }

  if (!ready || (effectiveTeamId && isLoadingApiTeam))
    return (
      <Panel>
        <p role="status" className="text-sm text-slate-500">
          Loading team…
        </p>
      </Panel>
    )

  const teamName = apiTeam?.name || membership?.teamName || "My Team"
  const isPrivate = apiTeam ? !apiTeam.visibility : membership?.visibility === "private"
  const requirements = apiTeam?.description || membership?.requirements || ""
  const inviteCode =
    apiTeam?.team_codes?.[0]?.code ||
    (apiTeam as any)?.team_code ||
    membership?.inviteCode

  const apiMembers = apiTeam?.team_roles?.map((tr: any) => ({
    id: tr.user?.id || tr.id,
    name: tr.user?.username || (tr.user?.wallet_address ? `${tr.user.wallet_address.slice(0, 6)}...${tr.user.wallet_address.slice(-4)}` : "Member"),
    email: tr.user?.wallet_address ? `${tr.user.wallet_address.slice(0, 6)}...${tr.user.wallet_address.slice(-4)}` : (tr.user?.email || ""),
    role: tr.role === "LEAD" || tr.role === "LEADER" || tr.role === "lead" ? "lead" : "member",
    initials: (tr.user?.username || "M").slice(0, 2).toUpperCase(),
  }))

  const initialMembers =
    apiMembers && apiMembers.length > 0
      ? apiMembers
      : [
          {
            id: profile?.username || "user",
            name: profile?.username || "User",
            email: profile?.email || "",
            role: "lead",
            initials: (profile?.username || "U").slice(0, 2).toUpperCase(),
          },
        ]

  const effectiveFormation = apiTeam?.competition?.formation || formation
  const apiMaxTeamSize = apiTeam?.competition?.max_team_size ?? apiTeam?.competition?.maxTeamSize
  const effectiveCapacity = effectiveFormation
    ? parseCapacityFromFormation(effectiveFormation, apiMaxTeamSize ?? capacity)
    : (apiMaxTeamSize ?? capacity)

  if (!mounted || !connected) return null

  if (membership?.status === "pending")
    return (
      <Panel>
        <h2 className="font-bold">Join request pending</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Your request to join {teamName} is awaiting approval.
        </p>
      </Panel>
    )

  return (
    <>
      <Panel>
        <SectionHeading
          title="Your Team"
          aside={
            <Badge>
              {isPrivate ? "Private · Invite Only" : "Public Team"}
            </Badge>
          }
        />
        {requirements && (
          <p className="text-sm leading-6 text-muted-foreground">
            {requirements}
          </p>
        )}
        {inviteCode && (
          <p className="mt-3 text-sm">
            Invite code:{" "}
            <code className="rounded bg-blue-50 px-2 py-1 text-primary">
              {inviteCode}
            </code>
          </p>
        )}
      </Panel>
      <TeamManagement
        key={effectiveTeamId || teamName}
        capacity={effectiveCapacity}
        formation={effectiveFormation}
        isLeader={isLeader}
        onRename={(name) => renameTeam(competitionSlug, name)}
        onUpdateTeam={handleUpdateTeam}
        initialTeam={{
          name: teamName,
          description: apiTeam?.description || "",
          visibility: apiTeam ? apiTeam.visibility : (membership?.visibility !== "private"),
          skills: apiTeam?.skills_team?.map((s: { name: string }) => s.name) || [],
          members: initialMembers,
        }}
      />
    </>
  )
}

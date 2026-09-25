"use client"
import { useMemberships } from "@/features/registration/hooks/use-memberships"
import { Badge, Panel, SectionHeading } from "@/components/ui/page-primitives"
import { TeamManagement } from "./team-management"
import { useSiteActions } from "@/components/layout/site-actions"
import { useQuery } from "@tanstack/react-query"
import { fetchTeamDetail } from "@/lib/competitions-api"

export function RegisteredTeam({
  competitionSlug,
  capacity,
  teamId,
}: {
  competitionSlug: string
  capacity: number
  teamId?: string
}) {
  const { memberships, ready, renameTeam } = useMemberships()
  const { profile, connected } = useSiteActions()

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
    role: tr.role === "LEADER" || tr.role === "lead" ? "lead" : "member",
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

  if (!connected && !apiTeam && !membership)
    return <TeamManagement capacity={capacity} />

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
        capacity={capacity}
        onRename={(name) => renameTeam(competitionSlug, name)}
        initialTeam={{
          name: teamName,
          members: initialMembers,
          requests: [],
        }}
      />
    </>
  )
}

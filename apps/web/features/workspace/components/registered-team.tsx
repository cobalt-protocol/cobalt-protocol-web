"use client"
import { useMemberships } from "@/features/registration/hooks/use-memberships"
import { useBrowserDraft } from "@/lib/browser-draft"
import {
  mockProfile,
  isBuilderProfile,
  profileStorageKey,
} from "@/features/profile/data/profile"
import { Badge, Panel, SectionHeading } from "@/components/ui/page-primitives"
import { TeamManagement } from "./team-management"
import { useSiteActions } from "@/components/layout/site-actions"
export function RegisteredTeam({
  competitionSlug,
  capacity,
}: {
  competitionSlug: string
  capacity: number
}) {
  const { memberships, ready, renameTeam } = useMemberships()
  const { value: profile } = useBrowserDraft(
    profileStorageKey,
    mockProfile,
    isBuilderProfile
  )
  const { connected } = useSiteActions()
  const membership = memberships.find(
    (item) => item.competitionSlug === competitionSlug
  )
  if (!ready) return <p role="status">Loading team…</p>
  if (!connected || !membership) return <TeamManagement capacity={capacity} />
  if (membership.status === "pending")
    return (
      <Panel>
        <h2 className="font-bold">Join request pending</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Your request to join {membership.teamName} is awaiting approval.
        </p>
      </Panel>
    )
  if (membership.role === "member")
    return (
      <Panel>
        <SectionHeading
          title={membership.teamName}
          aside={<Badge tone="green">Joined · Preview</Badge>}
        />
        <p className="text-sm text-muted-foreground">
          You joined this private squad as @{profile.username}. The full member
          roster will appear after backend integration.
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
              {membership.visibility === "private"
                ? "Private · Invite Only"
                : "Public Team"}
            </Badge>
          }
        />
        <p className="text-sm leading-6 text-muted-foreground">
          {membership.requirements}
        </p>
        {membership.inviteCode && (
          <p className="mt-3 text-sm">
            Invite code:{" "}
            <code className="rounded bg-blue-50 px-2 py-1 text-primary">
              {membership.inviteCode}
            </code>
          </p>
        )}
      </Panel>
      <TeamManagement
        key={membership.teamId}
        capacity={capacity}
        onRename={(name) => renameTeam(competitionSlug, name)}
        initialTeam={{
          name: membership.teamName,
          members: [
            {
              id: profile.username,
              name: profile.username,
              email: profile.email,
              role: "lead",
              initials: profile.username.slice(0, 2).toUpperCase(),
            },
          ],
          requests: [],
        }}
      />
    </>
  )
}

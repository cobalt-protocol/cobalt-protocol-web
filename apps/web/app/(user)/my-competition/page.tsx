"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useChainId } from "wagmi"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, Award, ExternalLink, FileBadge, Loader2, Search, Trophy, Users } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  fetchApiMe,
  fetchMyParticipantMintedCertificatesByTeamResult,
  fetchMyTeamsResult,
  getStoredToken,
  type ApiTeam,
} from "@/lib/competitions-api"
import { routes } from "@/lib/routes"
import { PageContainer } from "@/components/ui/page-primitives"

function getInitials(name: string): string {
  if (!name) return "TM"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2 && parts[0]?.[0] && parts[1]?.[0]) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}
function formatDate(d?: string | null): string {
  if (!d) return "-"
  try {
    const x = new Date(d)
    if (isNaN(x.getTime())) return d
    return x.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
  } catch { return d }
}

function TeamRow({ team, meUser, chainId }: { team: ApiTeam; meUser: any; chainId: number }) {
  const comp: any = team.competition || {}
  const roles: any[] = (team as any).team_roles || []
  const myRole = meUser ? roles.find((r: any) => r.user_id === meUser.id)?.role : null
  const displayRole = myRole ? (String(myRole).toLowerCase() === "lead" ? "Lead" : "Member") : "Member"
  const memberCount = roles.length || 1
  const isLead = String(myRole).toLowerCase() === "lead"

  // Fetch certificate for this specific team context
  const { data: certResult, isLoading: certLoading } = useQuery({
    queryKey: ["my-participant-cert", team.id],
    queryFn: () => fetchMyParticipantMintedCertificatesByTeamResult(team.id, { limit: 1 }, getStoredToken()),
    enabled: Boolean(getStoredToken()),
    retry: false, // 404 is valid when not minted
  })

  const cert = certResult?.data?.[0]
  const hasCert = Boolean(cert)

  return (
    <TableRow className="hover:bg-slate-50/60">
      <TableCell className="pl-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/10 text-xs font-bold text-[#2563EB]">
            {getInitials(team.name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="truncate text-sm font-semibold text-slate-900">{team.name}</div>
              {hasCert && (
                <div title="Participant Certificate Issued">
                  <FileBadge className="h-4 w-4 text-[#2563EB]" />
                </div>
              )}
            </div>
            <div className="truncate text-xs text-slate-500">
              {formatDate(team.created_at)} &middot; {team.id.slice(0, 8)}...
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-slate-900">{comp.name || "-"}</div>
          <div className="truncate text-xs text-slate-500">
            {comp.category || "Competition"} &middot; {comp.competition_id || comp.id || "-"}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant="secondary"
          className={isLead ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}
        >
          {displayRole}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <span className="inline-flex items-center gap-1 text-sm text-slate-700">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          {memberCount}
        </span>
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant="outline"
          className={team.visibility ? "border-0 bg-emerald-50 text-emerald-700" : "border-0 bg-purple-50 text-purple-700"}
        >
          <span className={"mr-1.5 inline-block h-1.5 w-1.5 rounded-full " + (team.visibility ? "bg-emerald-500" : "bg-purple-500")} />
          {team.visibility ? "Public" : "Private"}
        </Badge>
      </TableCell>
      <TableCell className="pr-6 text-right">
        <div className="flex items-center justify-end gap-2">
          {hasCert && cert?.tx_hash && (
            <Link
              href={routes.explorer.tx(chainId, cert.tx_hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
              title="View transaction on explorer"
            >
              <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
            </Link>
          )}
          {(() => {
            const teamStatus = (team as any).status as string | undefined
            const isPending = teamStatus === "pending"
            return isPending ? (
              <Button
                variant="ghost"
                size="sm"
                disabled
                title="Join request pending — waiting for approval"
                className="font-medium text-slate-400 cursor-not-allowed opacity-60"
              >
                Open Workspace
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Link href={routes.workspace(team.id)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-medium text-[#2563EB] hover:bg-[#EFF4FF] hover:text-[#2563EB]"
                >
                  Open Workspace
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )
          })()}
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function MyCompetitionsPage() {
  const chainId = useChainId()
  const [storedToken, setStoredToken] = useState<string | null>(null)
  const [hasCheckedToken, setHasCheckedToken] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    setStoredToken(getStoredToken())
    setHasCheckedToken(true)
    const h = () => setStoredToken(getStoredToken())
    if (typeof window !== "undefined") {
      window.addEventListener("cobalt:auth_change", h)
      window.addEventListener("storage", h)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("cobalt:auth_change", h)
        window.removeEventListener("storage", h)
      }
    }
  }, [])

  const { data: meUser } = useQuery({
    queryKey: ["user-me", storedToken],
    queryFn: () => fetchApiMe(storedToken || getStoredToken()),
    enabled: Boolean(storedToken),
  })

  const { data: teamsResult, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["my-teams", chainId, storedToken],
    queryFn: () => fetchMyTeamsResult(chainId, storedToken || getStoredToken()),
    enabled: hasCheckedToken && Boolean(storedToken),
  })

  const teams: ApiTeam[] = useMemo(() => (teamsResult?.data as ApiTeam[] | null) || [], [teamsResult])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return teams
    return teams.filter((t) => {
      const comp: any = t.competition || {}
      const hay = [t.name, comp.name || "", comp.category || "", t.description || ""].join(" ").toLowerCase()
      return hay.includes(q)
    })
  }, [teams, query])

  const isAuthError = teamsResult?.status === 401 || teamsResult?.status === 403

  if (!hasCheckedToken) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20 text-sm text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your competitions...
        </div>
      </PageContainer>
    )
  }

  if (!storedToken) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-3xl py-10">
          <h1 className="text-2xl font-bold tracking-tight">Joined Competitions</h1>
          <p className="mt-2 text-sm text-slate-500">
            Connect your wallet and sign in to see teams where you are a member.
          </p>
          <Card className="mt-6 border-0 bg-white shadow-none">
            <CardContent className="p-8 text-center">
              <Trophy className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold">No session found</p>
              <p className="mt-1 text-xs text-slate-500">Please connect wallet from header and complete sign-in. After that this table will list your teams for chain {chainId}.</p>
              <div className="mt-4 flex justify-center gap-2">
                <Link href={routes.competitions}><Button variant="outline">Browse Competitions</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href={routes.competitions} className="hover:underline">Competitions</Link>
            <span aria-hidden>\u203A</span>
            <span className="font-medium text-slate-900">My Competitions</span>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Joined Competitions</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Teams where you are a member (<code className="rounded bg-slate-100 px-1">team_role.user_id = JWT sub</code>), scoped by <code className="rounded bg-slate-100 px-1">chainId {chainId}</code> via <code className="rounded bg-slate-100 px-1">GET /api/v1/chains/:chainId/teams</code>. Source of truth is <code className="rounded bg-slate-100 px-1">team_role \u2192 team \u2192 competition</code>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-[#EFF4FF] text-[#2563EB]">Chain {chainId}</Badge>
              {meUser && <span className="text-xs text-slate-500">@{meUser.username || meUser.wallet_address?.slice(0, 8)}</span>}
            </div>
          </div>
        </div>

        <Card className="border-0 bg-white shadow-none">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search team or competition..." className="pl-9" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{filtered.length} of {teams.length} teams</span>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>Refresh</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 bg-white shadow-none">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#EFF4FF] hover:bg-[#EFF4FF]">
                <TableHead className="w-[28%] pl-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Team</TableHead>
                <TableHead className="w-[32%] text-xs font-semibold uppercase tracking-wider text-slate-500">Competition</TableHead>
                <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Role</TableHead>
                <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Members</TableHead>
                <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Visibility</TableHead>
                <TableHead className="pr-6 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500"><Loader2 className="mx-auto h-5 w-5 animate-spin text-[#2563EB]" /><span className="mt-2 block">Loading your teams for chain {chainId}...</span></TableCell></TableRow>
              ) : isAuthError ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm"><p className="font-semibold text-red-600">Unauthorized (HTTP {teamsResult?.status})</p><p className="mt-1 text-xs text-slate-500">{teamsResult?.error || "Session invalid or expired. Please reconnect and sign again."}</p><Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Retry</Button></TableCell></TableRow>
              ) : isError ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-red-600">{(error as Error)?.message || "Failed to load teams."}</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">{teams.length === 0 ? (<><Users className="mx-auto h-6 w-6 text-slate-300" /><p className="mt-2 font-medium">No joined competitions yet</p><p className="mt-1 text-xs">You are not a member of any team on chain {chainId}. Create or join a team from a competition page.</p><Link href={routes.competitions} className="mt-3 inline-block"><Button size="sm">Browse Competitions</Button></Link></>) : (<>No teams match \u201C{query}\u201D.</>)}</TableCell></TableRow>
              ) : (
                filtered.map((team) => (
                  <TeamRow key={team.id} team={team} meUser={meUser} chainId={chainId} />
                ))
              )}
            </TableBody>
          </Table>
        </Card>
        <p className="text-xs text-slate-400">Tip: endpoint is <code className="rounded bg-slate-100 px-1">GET /api/v1/chains/:chainId/teams</code> with <code className="rounded bg-slate-100 px-1">Authorization: Bearer &lt;JWT&gt;</code> (JWT sub = userId). Requests without token return 401.</p>
      </div>
    </PageContainer>
  )
}

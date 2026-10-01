"use client"

import { useEffect, useState } from "react"
import { Check, Clock, Loader2, UserPlus, X } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Badge, Panel, SectionHeading } from "@/components/ui/page-primitives"
import {
  acceptTeamJoinRequest,
  fetchTeamJoinRequestsResult,
  getStoredToken,
  rejectTeamJoinRequest,
  type ApiRequestJoin,
} from "@/lib/competitions-api"

function displayName(request: ApiRequestJoin): string {
  const user = request.user
  if (user?.username) return user.username
  if (user?.wallet_address) {
    return `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`
  }
  return `Builder ${request.user_id.slice(-6)}`
}

function initialsOf(request: ApiRequestJoin): string {
  const cleaned = displayName(request).replace(/[^a-zA-Z0-9]/g, "")
  return cleaned.slice(0, 2).toUpperCase() || "B"
}

function formatRequestedAt(value?: string): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function skillDescriptionOf(request: ApiRequestJoin): string {
  return request.user?.skill_description?.description?.trim() ?? ""
}

function skillsOf(request: ApiRequestJoin): string[] {
  const raw = request.user?.skills
  if (!Array.isArray(raw)) return []
  return raw
    .map((skill) =>
      typeof skill === "string"
        ? skill
        : (skill?.name ?? skill?.skill_name ?? "")
    )
    .map((name) => name.trim())
    .filter(Boolean)
}

export function IncomingJoinRequests({ teamId }: { teamId?: string }) {
  const [mounted, setMounted] = useState(false)
  const [storedToken, setStoredToken] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    setMounted(true)
    setStoredToken(getStoredToken())
  }, [])

  const { data: result, isLoading } = useQuery({
    queryKey: ["team-join-requests", teamId, storedToken],
    queryFn: () =>
      teamId ? fetchTeamJoinRequestsResult(teamId, storedToken) : null,
    enabled: Boolean(teamId) && Boolean(storedToken),
  })

  const status = result?.status
  const requests = result?.data ?? []

  const handleAction = async (
    requestId: string,
    action: "accept" | "reject"
  ) => {
    if (!teamId) return
    setPendingAction(requestId)
    setActionError(null)
    try {
      if (action === "accept") {
        await acceptTeamJoinRequest(teamId, requestId, storedToken)
      } else {
        await rejectTeamJoinRequest(teamId, requestId, storedToken)
      }

      await queryClient.invalidateQueries({
        queryKey: ["team-join-requests", teamId],
      })
      if (action === "accept") {
        await queryClient.invalidateQueries({ queryKey: ["team-members", teamId] })
        await queryClient.invalidateQueries({ queryKey: ["team-detail", teamId] })
        await queryClient.invalidateQueries({
          queryKey: ["team-competition", teamId],
        })
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to update join request"
      )
    } finally {
      setPendingAction(null)
    }
  }

  if (!mounted || !storedToken || !teamId) return null

  // GET /teams/:teamId/requests returns 401/403 for non-leaders and 404 when the
  // team does not exist — hide the panel in those cases.
  if (status === 401 || status === 403 || status === 404) return null

  const isError = status !== undefined && status >= 500
  const pendingRequests = requests.filter(
    (request) => (request.status || "").toLowerCase() === "pending"
  )

  return (
    <Panel>
      <SectionHeading
        title="Incoming Join Requests & Builder Pitches"
        description="Review builders requesting to join your squad and act on their pitches."
        aside={
          <Badge tone={pendingRequests.length > 0 ? "blue" : "neutral"}>
            {pendingRequests.length} Pending
          </Badge>
        }
      />

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {actionError}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          Unable to load join requests. Please try again later.
        </div>
      )}

      {isLoading && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-slate-500"
        >
          <Loader2 className="size-4 animate-spin" />
          Loading join requests...
        </p>
      )}

      {!isLoading && !isError && pendingRequests.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-slate-50 p-6 text-center">
          <UserPlus className="mx-auto text-slate-400" size={24} />
          <p className="mt-3 text-sm font-medium text-slate-500">
            No incoming join requests yet.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Builder pitches will appear here when someone requests to join your
            team.
          </p>
        </div>
      )}

      {!isLoading && !isError && pendingRequests.length > 0 && (
        <ul className="space-y-3">
          {pendingRequests.map((request) => {
            const isPending = (request.status || "").toLowerCase() === "pending"
            const isBusy = pendingAction === request.id
            const meta = [request.user?.institution, request.user?.location]
              .filter(Boolean)
              .join(" · ")
            const pitch = request.pitch?.trim()
            const skillDescription = skillDescriptionOf(request)
            const skills = skillsOf(request)

            return (
              <li
                key={request.id}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-slate-50 p-4 md:flex-row md:items-start md:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {initialsOf(request)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold">
                        {displayName(request)}
                      </h3>
                      <Badge tone={isPending ? "blue" : "neutral"}>
                        {isPending ? "Pending" : request.status || "Processed"}
                      </Badge>
                    </div>
                    {meta && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {meta}
                      </p>
                    )}
                    {pitch ? (
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        “{pitch}”
                      </p>
                    ) : skillDescription ? (
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        {skillDescription}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs italic leading-5 text-muted-foreground">
                        No builder pitch provided.
                      </p>
                    )}
                    {skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center rounded-md bg-secondary/70 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock size={10} />
                      Requested {formatRequestedAt(request.created_at)}
                    </p>
                  </div>
                </div>

                {isPending && (
                  <div className="flex shrink-0 gap-2 md:pl-4">
                    <Button
                      size="sm"
                      onClick={() => handleAction(request.id, "accept")}
                      disabled={isBusy}
                    >
                      {isBusy ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Check className="size-3.5" />
                      )}
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(request.id, "reject")}
                      disabled={isBusy}
                    >
                      <X className="size-3.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

"use client"
import { useCallback, useEffect, useState } from "react"
import { fetchMyTeams, type ApiTeam } from "@/lib/competitions-api"
import type { PreviewMembership } from "../types"

export function useMemberships() {
  const [memberships, setMemberships] = useState<PreviewMembership[]>([])
  const [ready, setReady] = useState(false)

  const reloadMemberships = useCallback(async () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("cobalt:memberships:v1")
      } catch {
        // Ignore storage removal error
      }
    }

    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("cobalt:access_token")
        : null

    if (!token) {
      setMemberships([])
      setReady(true)
      return
    }

    try {
      const apiTeams = await fetchMyTeams(token)
      if (Array.isArray(apiTeams)) {
        const mapped: PreviewMembership[] = apiTeams.map((team: ApiTeam) => {
          const compObj = (team as any).competition
          const compSlug =
            compObj?.slug || (team as any).competition_slug || team.competition_id || ""
          const compId = compObj?.id || team.competition_id || ""
          const inviteCode =
            team.team_codes?.[0]?.code || (team as any).team_code || null
          const visibility =
            (team as any).visibility === false || (team as any).visibility === "private"
              ? "private"
              : "public"

          return {
            competitionId: compId,
            competitionSlug: compSlug,
            teamId: team.id,
            teamName: team.name,
            visibility,
            requirements: team.description || "",
            ownerUsername: (team as any).lead?.username || (team as any).user?.username || "",
            role: "lead",
            status: "active",
            inviteCode,
            rawTeam: team,
          }
        })
        setMemberships(mapped)
      } else {
        setMemberships([])
      }
    } catch {
      setMemberships([])
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    reloadMemberships()

    const handleReload = () => {
      reloadMemberships()
    }

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleReload)
      window.addEventListener("storage", handleReload)
      window.addEventListener("cobalt:auth_change", handleReload)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleReload)
        window.removeEventListener("storage", handleReload)
        window.removeEventListener("cobalt:auth_change", handleReload)
      }
    }
  }, [reloadMemberships])

  function addMembership(membership: PreviewMembership): boolean {
    setMemberships((prev) => {
      const exists = prev.some(
        (item) =>
          item.competitionSlug === membership.competitionSlug ||
          (membership.competitionId && item.competitionId === membership.competitionId)
      )
      if (exists) return prev
      return [...prev, membership]
    })
    return true
  }

  function renameTeam(competitionSlug: string, name: string): boolean {
    if (!name.trim() || name.trim().length > 24) return false
    setMemberships((prev) =>
      prev.map((item) =>
        item.competitionSlug === competitionSlug || item.competitionId === competitionSlug
          ? { ...item, teamName: name.trim() }
          : item
      )
    )
    return true
  }

  return { memberships, addMembership, renameTeam, ready, reloadMemberships }
}

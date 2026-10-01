"use client"
import { useCallback, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { fetchUserDashboard } from "@/lib/competitions-api"
import type { PreviewMembership } from "../types"

export function useMemberships() {
  const pathname = usePathname()
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

        if (
      pathname?.startsWith("/organization") ||
      pathname?.includes("/join-team") ||
      pathname?.startsWith("/my-competition")
    ) {
      setMemberships([])
      setReady(true)
      return
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
      const dashboard = await fetchUserDashboard(token)
      const mapped: PreviewMembership[] = []

      for (const membership of dashboard?.memberships || []) {
        const competitionId = membership.competition?.id || ""
        mapped.push({
          competitionId,
          competitionSlug: competitionId,
          teamId: membership.teamId,
          teamName: membership.teamName,
          visibility:
            membership.visibility === "private" ? "private" : "public",
          requirements: "",
          ownerUsername: "",
          role: membership.role === "lead" ? "lead" : "member",
          status: "active",
          inviteCode: null,
        })
      }

      for (const request of dashboard?.pendingRequests || []) {
        mapped.push({
          competitionId: request.competitionId || "",
          competitionSlug: request.competitionSlug || request.competitionId || "",
          teamId: request.teamId,
          teamName: request.teamName,
          visibility: "public",
          requirements: "",
          ownerUsername: "",
          role: "member",
          status: "pending",
          inviteCode: null,
        })
      }

      setMemberships(mapped)
    } catch {
      setMemberships([])
    } finally {
      setReady(true)
    }
  }, [pathname])

  useEffect(() => {
    if (
      pathname?.startsWith("/organization") ||
      pathname?.includes("/join-team") ||
      pathname?.startsWith("/my-competition")
    ) {
      setMemberships([])
      setReady(true)
      return
    }

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
  }, [reloadMemberships, pathname])

  function addMembership(membership: PreviewMembership): boolean {
    setMemberships((prev) => {
      const exists = prev.some(
        (item) =>
          item.competitionSlug === membership.competitionSlug ||
          (membership.competitionId &&
            item.competitionId === membership.competitionId)
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
        item.competitionSlug === competitionSlug ||
        item.competitionId === competitionSlug
          ? { ...item, teamName: name.trim() }
          : item
      )
    )
    return true
  }

  return { memberships, addMembership, renameTeam, ready, reloadMemberships }
}

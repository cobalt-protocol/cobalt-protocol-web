"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Calendar, Plus, Search, Users } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Card, CardContent, CardFooter } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import type { OrganizerCompetitionStatus } from "../api/contracts"
import { useOrganizerCompetitions } from "../hooks/use-organizer-competitions"
import {
  formatCompetitionDate,
  getCompetitionPhase,
} from "../lib/competition"

type StatusFilter = OrganizerCompetitionStatus | "ALL"

export function OrganizerCompetitionList() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("ALL")
  const query = useOrganizerCompetitions(status === "ALL" ? undefined : status)

  const competitions = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return query.data?.data ?? []
    return (query.data?.data ?? []).filter(
      (competition) =>
        competition.title.toLowerCase().includes(normalized) ||
        competition.category.toLowerCase().includes(normalized)
    )
  }, [query.data, search])

  return (
    <div className="w-full bg-[#E5EEFF] py-10">
      <div className="mx-auto flex max-w-7xl flex-col px-5 md:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">
              Competition List
            </h1>
            <p className="mt-1 text-[#434655]">
              Create, review, and publish competitions owned by your organization.
            </p>
          </div>
          <Link
            href="/competition/create"
            className={cn(
              buttonVariants(),
              "bg-[#2563EB] text-white hover:bg-blue-700"
            )}
          >
            <Plus className="size-4" /> Create Competition
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-xl bg-white p-3 md:flex-row md:justify-between">
          <div className="relative w-full md:max-w-lg">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by competition name or category..."
              className="border-0 bg-[#F8FAFC] pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              if (value) setStatus(value as StatusFilter)
            }}
          >
            <SelectTrigger className="w-full border-0 bg-[#F8FAFC] md:w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {query.isPending && (
          <p className="py-16 text-center text-slate-500">
            Loading organizer competitions...
          </p>
        )}
        {query.isError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {query.error instanceof Error
              ? query.error.message
              : "Unable to load competitions."}
          </div>
        )}

        {!query.isPending && !query.isError && (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {competitions.map((competition) => (
              <Card key={competition.id} className="border-0 bg-white shadow-none">
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <Badge variant="secondary">{competition.category}</Badge>
                    <Badge
                      className={
                        competition.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }
                    >
                      {competition.status === "PUBLISHED"
                        ? getCompetitionPhase(competition)
                        : "Draft"}
                    </Badge>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {competition.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {competition.description}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-slate-500">
                    <p className="flex items-center gap-2">
                      <Calendar className="size-4 text-blue-600" />
                      {formatCompetitionDate(competition.startsAt)}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="size-4 text-blue-600" />
                      {competition.teamCount} teams · max {competition.maxTeamSize} members
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="border-0 bg-[#EFF4FF]/60 p-4">
                  <Link
                    href={`/competition/${competition.id}`}
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "w-full justify-between px-0"
                    )}
                  >
                    View Competition Detail <ArrowRight className="size-4" />
                  </Link>
                </CardFooter>
              </Card>
            ))}
            {competitions.length === 0 && (
              <div className="col-span-full rounded-xl bg-white py-16 text-center text-slate-500">
                No competitions found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

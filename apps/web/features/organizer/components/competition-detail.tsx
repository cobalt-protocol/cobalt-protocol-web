"use client"

import Link from "next/link"
import { BookOpen, Calendar, ChevronLeft, Send, Users } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  useOrganizerCompetition,
  usePublishOrganizerCompetition,
} from "../hooks/use-organizer-competitions"
import {
  formatCompetitionDate,
  getCompetitionPhase,
} from "../lib/competition"

export function OrganizerCompetitionDetail({ id }: { id: string }) {
  const competitionQuery = useOrganizerCompetition(id)
  const publishCompetition = usePublishOrganizerCompetition(id)

  if (competitionQuery.isPending) {
    return (
      <div className="min-h-[50vh] bg-[#F8F9FF] py-20 text-center text-slate-500">
        Loading competition...
      </div>
    )
  }
  if (competitionQuery.isError || !competitionQuery.data) {
    return (
      <div className="min-h-[50vh] bg-[#F8F9FF] px-5 py-20 text-center">
        <p className="text-red-700">
          {competitionQuery.error instanceof Error
            ? competitionQuery.error.message
            : "Competition not found."}
        </p>
        <Link
          href="/organization"
          className={cn(buttonVariants({ variant: "link" }), "mt-3")}
        >
          Back to competitions
        </Link>
      </div>
    )
  }

  const competition = competitionQuery.data
  const publishError =
    publishCompetition.error instanceof Error
      ? publishCompetition.error.message
      : null

  return (
    <div className="w-full bg-[#F8F9FF] py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 md:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/organization"
              className="mb-3 flex items-center gap-1 text-sm text-blue-600"
            >
              <ChevronLeft className="size-4" /> Back to competitions
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">
                {competition.title}
              </h1>
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
            <p className="mt-2 text-slate-500">{competition.category}</p>
          </div>
          {competition.status === "DRAFT" && (
            <Button
              onClick={() => publishCompetition.mutate()}
              disabled={publishCompetition.isPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Send className="size-4" />
              {publishCompetition.isPending ? "Publishing..." : "Publish competition"}
            </Button>
          )}
        </div>

        {publishError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {publishError}
          </div>
        )}

        <Card className="border-0 bg-white shadow-none">
          <CardContent className="space-y-8 p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Team capacity
                </p>
                <p className="mt-2 flex items-center gap-2 font-semibold text-slate-800">
                  <Users className="size-4 text-blue-600" />
                  {competition.teamCount} teams · {competition.maxTeamSize} members max
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-5 md:col-span-2">
                <p className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Public slug
                </p>
                <p className="mt-2 font-semibold text-slate-800">
                  {competition.slug ?? "Generated when this draft is published"}
                </p>
              </div>
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Description</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {competition.description}
              </p>
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Participant requirements</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {competition.requirements}
              </p>
            </div>

            <div>
              <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                <Calendar className="size-5 text-blue-600" /> Timeline
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["Registration ends", competition.registrationEndsAt],
                  ["Competition starts", competition.startsAt],
                  ["Submission deadline", competition.submissionDeadline],
                  ["Judging ends", competition.judgingEndsAt],
                  ["Results announced", competition.resultsAt],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-[#EFF4FF]/60 p-4">
                    <p className="text-xs font-semibold text-slate-500">{label}</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {formatCompetitionDate(value!)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-bold text-slate-900">
                  <BookOpen className="size-4 text-blue-600" /> Guidebook reference
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {competition.guidebookCid || "No guidebook CID provided."}
                </p>
              </div>
              {competition.status === "PUBLISHED" && competition.slug && (
                <Link
                  href={`/competitions/${competition.slug}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  View participant page
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800">
          Team/submission review, prize configuration, and winner selection are not
          connected yet. This screen only displays data confirmed by the current
          organizer competition API.
        </div>
      </div>
    </div>
  )
}

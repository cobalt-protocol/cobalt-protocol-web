"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Flame, FolderX, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { CompetitionCard } from "@/features/competitions/components/competition-card"
import {
  competitionCategories,
  type CompetitionCategory,
} from "@/features/competitions/types"
import { fetchCompetitions } from "@/lib/competitions-api"
import { routes } from "@/lib/routes"

export function FeaturedCompetitions({
  referenceDate,
}: {
  referenceDate?: string
}) {
  const [category, setCategory] = useState<CompetitionCategory | "All">("All")

  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ["competitions-public"],
    queryFn: () => fetchCompetitions(null),
  })

  const featured = competitions.slice(0, 3)
  const totalCount = competitions.length

  const filtered = featured.filter(
    (item) => category === "All" || item.category === category
  )

  return (
    <section className="bg-white py-12" id="competitions">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-primary">
              <Flame size={12} />
              Active Arenas
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
              Featured Competitions
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse high-stakes challenges backed with verified, pre-locked
              prize pools.
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {(["All", ...competitionCategories] as const).map((item) => (
              <button
                key={item}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className="rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold aria-pressed:bg-primary aria-pressed:text-white"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
            <span>Loading competitions from API...</span>
          </div>
        ) : competitions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FolderX size={28} />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Competitions Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              There are currently no active competitions available. Please check back later.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((competition) => (
                <CompetitionCard
                  key={competition.id}
                  competition={competition}
                  referenceDate={referenceDate}
                />
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-10 text-center text-muted-foreground">
                No featured competitions in this category. Explore the full
                directory below.
              </p>
            )}
            <div className="mt-9 text-center">
              <Link
                href={routes.competitions}
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-bold text-primary"
              >
                View All {totalCount} Competitions <ArrowRight size={16} />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

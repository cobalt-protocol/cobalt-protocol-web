"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Flame } from "lucide-react"
import { CompetitionCard } from "@/features/competitions/components/competition-card"
import {
  competitionCategories,
  type Competition,
  type CompetitionCategory,
} from "@/features/competitions/types"
import { routes } from "@/lib/routes"
export function FeaturedCompetitions({
  competitions,
  total,
  referenceDate,
}: {
  competitions: readonly Competition[]
  total: number
  referenceDate: string
}) {
  const [category, setCategory] = useState<CompetitionCategory | "All">("All")
  const filtered = competitions.filter(
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
            View All {total} Competitions <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}

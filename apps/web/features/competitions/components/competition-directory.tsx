"use client"
import {
  Breadcrumbs,
  PageContainer,
  Panel,
  fieldClass,
} from "@/components/ui/page-primitives"
import { routes } from "@/lib/routes"
import { Button } from "@workspace/ui/components/button"
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import { useState } from "react"
import { selectCompetitions } from "../lib/competition-selectors"
import {
  competitionCategories,
  type Competition,
  type CompetitionCategory,
  type CompetitionFilters,
} from "../types"
import { CompetitionCard } from "./competition-card"
const PAGE_SIZE = 9
const initialFilters: CompetitionFilters = {
  query: "",
  categories: [],
  deadline: "any",
  sort: "prize-desc",
}

export function CompetitionDirectory({
  competitions,
  referenceDate,
}: {
  competitions: readonly Competition[]
  referenceDate: string
}) {
  const [filters, setFilters] = useState<CompetitionFilters>(initialFilters)
  const [page, setPage] = useState(1)
  function updateFilters(changes: Partial<CompetitionFilters>) {
    setFilters((current) => ({ ...current, ...changes }))
    setPage(1)
  }
  function toggleCategory(category: CompetitionCategory) {
    updateFilters({
      categories: filters.categories.includes(category)
        ? filters.categories.filter((item) => item !== category)
        : [...filters.categories, category],
    })
  }
  const filtered = selectCompetitions(competitions, filters, referenceDate)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)
  return (
    <PageContainer>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-6">
        <div>
          <Breadcrumbs
            items={[
              { label: "Home", href: routes.home },
              { label: "Competitions" },
            ]}
          />
          <h1 className="text-3xl font-extrabold tracking-tight">
            Discover Competitions
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Browse vetted hackathons, case competitions, and other competitions
            with pre-funded and verifiable smart escrow guarantees.
          </p>
        </div>
        <Panel className="min-w-56">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            Active arenas
          </p>
          <p className="my-3 text-lg font-bold text-primary">
            <span className="mr-2 text-5xl text-foreground">
              {
                competitions.filter((item) => item.status !== "completed")
                  .length
              }
            </span>{" "}
            Live Competitions
          </p>
          <p className="text-xs text-muted-foreground">
            Across {competitionCategories.length} categories
          </p>
        </Panel>
      </div>
      <Panel className="mb-6">
        <label className="relative block">
          <span className="sr-only">Search competitions</span>
          <Search
            size={18}
            className="absolute top-3.5 left-3 text-muted-foreground"
          />
          <input
            className={fieldClass + " pl-10"}
            value={filters.query}
            onChange={(event) => updateFilters({ query: event.target.value })}
            placeholder="Search by competition name, host/organizer, or keywords..."
          />
        </label>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2" aria-label="Categories">
            <button
              className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold aria-pressed:bg-primary aria-pressed:text-white"
              aria-pressed={filters.categories.length === 0}
              onClick={() => updateFilters({ categories: [] })}
            >
              All Categories
            </button>
            {competitionCategories.map((category) => (
              <button
                key={category}
                aria-pressed={filters.categories.includes(category)}
                onClick={() => toggleCategory(category)}
                className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold aria-pressed:bg-primary aria-pressed:text-white"
              >
                {category}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filter by deadline"
              className={fieldClass + " w-auto py-2 text-xs"}
              value={filters.deadline}
              onChange={(event) => {
                const value = event.target.value
                if (value === "any" || value === "week" || value === "month")
                  updateFilters({ deadline: value })
              }}
            >
              <option value="any">Any Deadline</option>
              <option value="week">Within 7 days</option>
              <option value="month">Within 30 days</option>
            </select>
            <select
              aria-label="Sort competitions"
              className={fieldClass + " w-auto py-2 text-xs"}
              value={filters.sort}
              onChange={(event) => {
                const value = event.target.value
                if (
                  value === "prize-desc" ||
                  value === "deadline-asc" ||
                  value === "participants-desc"
                )
                  updateFilters({ sort: value })
              }}
            >
              <option value="prize-desc">Sort: Highest Prize</option>
              <option value="deadline-asc">Sort: Nearest Deadline</option>
              <option value="participants-desc">Sort: Most Participants</option>
            </select>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Active Filters:</span>
          {filters.categories.length === 0 && (
            <span className="text-muted-foreground">All categories</span>
          )}
          {filters.categories.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              aria-label={`Remove ${category} filter`}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1"
            >
              {category}
              <X size={12} />
            </button>
          ))}
          <button
            className="ml-auto font-semibold text-primary"
            onClick={() => {
              setFilters(initialFilters)
              setPage(1)
            }}
          >
            Reset All Filters
          </button>
        </div>
      </Panel>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((competition) => (
          <CompetitionCard
            key={competition.id}
            competition={competition}
            referenceDate={referenceDate}
          />
        ))}
      </div>
      {visible.length === 0 && (
        <Panel className="py-16 text-center">
          <h2 className="font-bold">No competitions found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different keyword or reset your filters.
          </p>
          <Button
            className="mt-5"
            onClick={() => {
              setFilters(initialFilters)
              setPage(1)
            }}
          >
            Reset filters
          </Button>
        </Panel>
      )}
      <nav
        aria-label="Competition pages"
        className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4"
      >
        <p role="status" className="text-xs text-muted-foreground">
          Showing {filtered.length === 0 ? 0 : start + 1}–
          {Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
          competitions
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            aria-label="Previous page"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft size={16} />
          </Button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (number) => (
              <Button
                key={number}
                variant={number === currentPage ? "default" : "secondary"}
                aria-label={`Page ${number}`}
                aria-current={number === currentPage ? "page" : undefined}
                onClick={() => setPage(number)}
              >
                {number}
              </Button>
            )
          )}
          <Button
            variant="ghost"
            aria-label="Next page"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </nav>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Design preview · sample competition dates are shown relative to April 4,
        2025.
      </p>
    </PageContainer>
  )
}

"use client"

import { fetchApiCompetitionById } from "@/lib/competitions-api"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  BookOpen,
  ChevronRight,
  Clock,
  Loader2,
  Search,
  Target,
  Trophy,
} from "lucide-react"
import Link from "next/link"
import { use, useState } from "react"

// --- Dummy Data ---
const teamsData = [
  {
    id: 1,
    initials: "SS",
    name: "Team SwarmSynthetix",
    members: "Alex Rivera, Sarah Chen, Marcus Zhao, Elena Vance",
    size: 4,
    status: "Submitted",
  },
  {
    id: 2,
    initials: "AZ",
    name: "AgentZero Labs",
    members: "Daniyal Kim, Sophie Tremblay, Leo Sterling",
    size: 3,
    status: "Submitted",
  },
  {
    id: 3,
    initials: "NV",
    name: "Nexus Vector",
    members: "Priya Sharma, Liam O'Connor, Mateo Santos, Aoi Tanai",
    size: 5,
    status: "Submitted",
  },
  {
    id: 4,
    initials: "CM",
    name: "Cognitive Mesh",
    members: "Kavita Reddy, Jordan Miller, Carlos Reyes, Ananya Gupta",
    size: 4,
    status: "Under Review",
  },
  {
    id: 5,
    initials: "DA",
    name: "DeFi Autonomous Ops",
    members: "Henrik Lindqvist, Maya Lin, Ethan Brooks",
    size: 3,
    status: "Incomplete",
  },
]

// --- Helper Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Submitted: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
    "Under Review": "bg-blue-50 text-blue-700 hover:bg-blue-50",
    Incomplete: "bg-red-50 text-red-700 hover:bg-red-50",
  }

  const dotColors: Record<string, string> = {
    Submitted: "bg-emerald-500",
    "Under Review": "bg-blue-500",
    Incomplete: "bg-red-500",
  }

  return (
    <Badge
      variant="outline"
      className={`flex w-fit items-center gap-1.5 rounded-full border-0 px-2.5 py-1 font-medium ${styles[status] || styles["Under Review"]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dotColors[status] || dotColors["Under Review"]}`}
      />
      {status}
    </Badge>
  )
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "TBA"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export default function CompetitionDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const [searchQuery, setSearchQuery] = useState("")

  const { data: apiCompetition, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: () => fetchApiCompetitionById(id),
    enabled: Boolean(id),
  })

  const filteredTeams = teamsData.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.members.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const title =
    apiCompetition?.name || "Autonomous Agents Global Hackathon 2025"
  const category = apiCompetition?.category || "AI & Autonomous Systems"
  const guidebookUrl = apiCompetition?.guidebook_cid
    ? `https://ipfs.io/ipfs/${apiCompetition.guidebook_cid}`
    : null

  const startDateLabel = formatDate(apiCompetition?.competition_window)
  const endDateLabel = formatDate(apiCompetition?.submission_deadline)
  const durationLabel = apiCompetition?.competition_window
    ? `${startDateLabel} - ${endDateLabel}`
    : "Apr 20 - May 05, 2025"
  return (
    <div className="w-full bg-[#F8F9FF] py-10">
      <div className="mx-auto flex max-w-7xl flex-col space-y-6 px-5 md:px-10">
        {/* --- Header Section --- */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="mb-2 flex items-center text-sm text-slate-500">
              <Link href="/organization" className="hover:underline">
                Dashboard
              </Link>
              <ChevronRight className="mx-1 h-4 w-4" />
              <span className="font-medium text-blue-600">
                Competition Detail
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Competition Detail
            </h1>
            <p className="mt-1 text-slate-500">
              Review competition information, monitor participating teams, and
              determine the winners.
            </p>
          </div>
          <Badge
            variant="outline"
            className="flex items-center gap-2 rounded-full border-0 bg-blue-50 px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-700"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
            EVALUATION PROTOCOL ACTIVE
          </Badge>
        </div>

        {isLoading ? (
          <Card className="rounded-xl border-0 bg-white p-12 text-center text-slate-500 shadow-none ring-0">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
            <p>Loading competition details from API...</p>
          </Card>
        ) : (
          /* --- Main Info Card --- */
          <Card className="overflow-hidden rounded-xl border-0 bg-white shadow-none ring-0">
            <CardContent className="p-6 md:p-8">
              <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="space-y-3">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-normal text-blue-700 hover:bg-blue-50"
                  >
                    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                    Judging & Evaluation Phase (Submissions Closed)
                  </Badge>
                  <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
                  {apiCompetition?.description && (
                    <p className="max-w-3xl text-sm text-slate-500">
                      {apiCompetition.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {guidebookUrl ? (
                    <a href={guidebookUrl} target="_blank" rel="noreferrer">
                      <Button
                        variant="outline"
                        className="border-0 bg-slate-100 font-medium text-slate-600 hover:bg-slate-200"
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        View Guidebook
                      </Button>
                    </a>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-0 bg-slate-100 font-medium text-slate-600 hover:bg-slate-200"
                      disabled
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      View Guidebook
                    </Button>
                  )}
                  <Link href={`/competition/${id}/winner`}>
                    <Button className="bg-blue-600 font-medium text-white hover:bg-blue-700">
                      <Trophy className="mr-2 h-4 w-4" />
                      Determine Winner
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Category */}
                <div className="flex flex-col gap-2 rounded-xl border-0 bg-slate-50 p-5">
                  <div className="flex items-center text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    <Target className="mr-2 h-4 w-4 text-blue-500" />
                    Competition Category
                  </div>
                  <div className="text-lg font-semibold text-slate-800">
                    {category}
                  </div>
                </div>

                {/* Prize Pool */}
                <div className="flex flex-col gap-2 rounded-xl border-0 bg-slate-50 p-5">
                  <div className="flex items-center text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    <Trophy className="mr-2 h-4 w-4 text-blue-500" />
                    Prize Pool
                  </div>
                  <div className="flex items-baseline gap-1 text-lg font-semibold text-slate-800">
                    $75,000 USDC
                    <span className="text-sm font-normal text-slate-500">
                      (Guaranteed Escrow Secured)
                    </span>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-2 rounded-xl border-0 bg-slate-50 p-5">
                  <div className="flex items-center text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    <Clock className="mr-2 h-4 w-4 text-blue-500" />
                    Competition Duration
                  </div>
                  <div className="text-lg font-semibold text-slate-800">
                    {durationLabel}
                  </div>
                  <div className="text-xs text-slate-500">
                    Submission Closed • Code Freeze Active
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* --- Search & Filter Bar --- */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-xl border-0 bg-white p-2 shadow-none ring-0 sm:flex-row">
          <div className="relative w-full sm:w-96">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by team name or team member name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-slate-50 pl-9 shadow-none focus-visible:ring-1 focus-visible:ring-blue-500"
            />
          </div>
          <div className="px-4 text-sm font-medium text-slate-500">
            Total Active:{" "}
            <span className="font-semibold text-blue-600">
              {filteredTeams.length} teams shown
            </span>
          </div>
        </div>

        {/* --- Teams Table --- */}
        <Card className="overflow-hidden rounded-xl border-0 bg-white py-0 shadow-none ring-0">
          <Table>
            <TableHeader className="border-0 bg-[#EFF4FF] [&_tr]:border-b-0">
              <TableRow className="border-0 border-b-0 bg-[#EFF4FF] hover:bg-[#EFF4FF]">
                <TableHead className="w-[30%] bg-[#EFF4FF] py-4 pl-6 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  TEAM NAME
                </TableHead>
                <TableHead className="w-[40%] bg-[#EFF4FF] py-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  TEAM MEMBERS
                </TableHead>
                <TableHead className="bg-[#EFF4FF] py-4 text-center text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  TEAM SIZE
                </TableHead>
                <TableHead className="bg-[#EFF4FF] py-4 pr-6 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  SUBMISSION STATUS
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => (
                <TableRow
                  key={team.id}
                  className="border-0 border-b-0 transition-colors hover:bg-slate-50/50"
                >
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {team.initials}
                      </div>
                      <span className="font-semibold text-slate-800">
                        {team.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-sm text-slate-500">
                    {team.members}
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600 hover:bg-slate-100"
                    >
                      {team.size} members
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 pr-6 text-right">
                    <div className="flex justify-end">
                      <StatusBadge status={team.status} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTeams.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-slate-500"
                  >
                    No teams found matching &quot;{searchQuery}&quot;
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}

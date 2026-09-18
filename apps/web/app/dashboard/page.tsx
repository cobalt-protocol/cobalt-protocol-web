import { getCompetitions } from "@/features/competitions/data/competition-repository"
import { ParticipantDashboard } from "@/features/dashboard/components/participant-dashboard"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "My Dashboard | Cobalt Protocol" }
export default function DashboardPage() {
  return <ParticipantDashboard competitions={getCompetitions()} />
}

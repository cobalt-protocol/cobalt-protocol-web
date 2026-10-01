import type { TeamState, SubmissionDraft } from "../types"
export const mockTeam: TeamState = {
  name: "Team SwarmSynthetix",
  members: [
    {
      id: "alex",
      name: "Alex Rivera",
      email: "alex.rivera@example.com",
      role: "lead",
      initials: "AR",
    },
    {
      id: "sarah",
      name: "Sarah Chen",
      email: "sarah.chen@example.com",
      role: "member",
      initials: "SC",
    },
    {
      id: "daniyal",
      name: "Daniyal Kim",
      email: "daniyal.kim@example.com",
      role: "member",
      initials: "DK",
    },
  ],
}
export const emptySubmission: SubmissionDraft = {
  title: "",
  description: "",
  link: "",
}

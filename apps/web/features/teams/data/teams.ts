import type { TeamListing } from "../types"

const templates: readonly Omit<TeamListing, "id">[] = [
  {
    name: "SwarmSynthetix",
    lead: "Marcus Kim",
    memberCount: 3,
    matchScore: 91,
    description:
      "Building a recursive multi-agent consensus protocol on Arbitrum Stylus. We have core settlement contracts locked and are looking to scale our sub-agent state machines and user orchestration layer.",
    roles: ["UI/UX Designer", "LangGraph / Agent Architect"],
  },
  {
    name: "Nexus Vector",
    lead: "Tariq Vance",
    memberCount: 4,
    matchScore: 89,
    description:
      "Zero-knowledge proofs for autonomous agent state validity without leaking proprietary prompt strategies or internal memory embeddings. Team consists of 2 cryptographic engineers and 2 ML researchers.",
    roles: ["UI/UX Designer", "Product Manager & Case Presenter"],
  },
  {
    name: "HyperScale Agents",
    lead: "Devin Vance",
    memberCount: 2,
    matchScore: 98,
    description:
      "Current stack: UI/UX & Product Lead onboard. Engineering distributed LangGraph pipelines for cross-chain execution and streaming state.",
    roles: ["LangGraph / Agent Architect", "Rust Core Developer"],
  },
  {
    name: "DeFi Autonomous Ops",
    lead: "Kiran Mehta",
    memberCount: 3,
    matchScore: 94,
    description:
      "Focus: High-frequency yield optimization loop architectures with self-hedging risk bounds. Developing simulated execution graphs.",
    roles: ["PyTorch Loop Engineer", "Rust State Engine"],
  },
]

// Stable demo identities shared by recommendation cards and the public directory.
export const publicTeams: readonly TeamListing[] = Array.from(
  { length: 54 },
  (_, index) => {
    const template = templates[index % templates.length]!
    const batch = Math.floor(index / templates.length)
    return {
      ...template,
      id: `public-team-${index + 1}`,
      name: `${template.name}${batch ? ` ${batch + 1}` : ""}`,
    }
  }
)
export const previewInviteCode = "SWARM-2025-X8K"
export const privateTeam: TeamListing = {
  ...templates[0]!,
  id: "private-swarm",
  name: "Swarm Private Squad",
  memberCount: 2,
}

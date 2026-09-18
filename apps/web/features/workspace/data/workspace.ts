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
  requests: [
    {
      id: "marcus-request",
      member: {
        id: "marcus",
        name: "Marcus Vance",
        email: "marcus.vance@example.com",
        role: "member",
        initials: "MV",
      },
      specialty: "Senior AI Engineer",
      location: "Zurich, CH",
      pitch:
        "I have production experience building hierarchical LangGraph agent workflows and decentralized tool arbitration. I can build out the multi-agent consensus engine and help with adversarial testing.",
      skills: ["PyTorch", "LangGraph / AutoGen", "Recursive Inference", "Rust"],
    },
    {
      id: "elena-request",
      member: {
        id: "elena",
        name: "Elena Rostova",
        email: "elena.rostova@example.com",
        role: "member",
        initials: "ER",
      },
      specialty: "Smart Contract Specialist",
      location: "London, UK",
      pitch:
        "I specialize in trustless multi-agent escrow and programmatic payout settlement contracts. I can help with contract fuzzing and optimized proof verification.",
      skills: [
        "Solidity / Foundry",
        "Arbitrum Stylus",
        "ZK Rollups",
        "Multi-Sig Vaults",
      ],
    },
  ],
}
export const emptySubmission: SubmissionDraft = {
  title: "",
  description: "",
  link: "",
}

import type { Competition } from "../types"
import { TOKENS } from "@/lib/tokens"

export const competitionPreviewDate = "2025-04-04T00:00:00Z"
const baseCompetition: Competition = {
  id: "agents",
  slug: "autonomous-agents-global-hackathon",
  txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  tx_hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  title: "Autonomous Agents Global Hackathon 2025",
  organizer: "OpenAI & Cobalt",
  organizerDescription:
    "A developer community bringing builders, researchers, and designers together to explore AI and decentralized infrastructure.",
  category: "AI & ML",
  tag: "AI / LLMs",
  icon: "bot",
  status: "registration-open",
  description:
    "Architect and benchmark self-orchestrating, recursive AI agents capable of external tool execution, autonomous financial settlements, and trust-minimized multi-agent consensus. Compete with machine learning engineers and systems architects across the globe.",
  registrationEndsAt: "2025-04-18T23:59:00Z",
  startsAt: "2025-04-20T00:00:00Z",
  endsAt: "2025-05-05T23:59:00Z",
  participants: 1240,
  teamCount: 280,
  maxTeamSize: 5,
  currency: TOKENS.USDT.symbol,
  prizes: [
    {
      id: "first",
      title: "1st Place Champion",
      amount: 35000,
      description: "Compute grants and a direct accelerator interview",
    },
    {
      id: "second",
      title: "2nd Place Finalist",
      amount: 20000,
      description: "Participation credential and ecosystem cloud credits",
    },
    {
      id: "third",
      title: "3rd Place Finalist",
      amount: 10000,
      description: "Developer showcase feature",
    },
    {
      id: "bounty",
      title: "Track Bounty",
      amount: 10000,
      description:
        "Special recognition for an outstanding technical contribution",
    },
  ],
  timeline: [
    {
      id: "registration",
      title: "Registration",
      description:
        "Register for the competition. Make sure your team is ready before registration closes.",
      dateLabel: "Closes Apr 18 · 23:59 UTC",
      status: "active",
    },
    {
      id: "submission",
      title: "Submission",
      description:
        "Work on your solution, collaborate with your team, and submit your final work.",
      dateLabel: "Apr 20 – May 05",
      status: "upcoming",
    },
    {
      id: "judging",
      title: "Judging",
      description:
        "Submissions will be evaluated by the judging panel based on the competition criteria.",
      dateLabel: "May 05 · 23:59 UTC",
      status: "locked",
    },
    {
      id: "announcement",
      title: "Announcement",
      description:
        "Final results will be announced, and winners can receive their rewards.",
      dateLabel: "May 10, 2025",
      status: "locked",
    },
    {
      id: "claim",
      title: "Claim Prize",
      description:
        "Winners can claim their prizes and certificates through the platform.",
      dateLabel: "May 10, 2025",
      status: "locked",
    },
  ],
  judgingCriteria: [
    {
      id: "efficacy",
      title: "Solution Efficacy",
      weight: 40,
      description:
        "Demonstrated performance against the challenge objectives and evaluation benchmarks.",
    },
    {
      id: "architecture",
      title: "System Architecture",
      weight: 35,
      description:
        "Code modularity, state management, and thoughtful technical design.",
    },
    {
      id: "safety",
      title: "Safety & Reliability",
      weight: 25,
      description:
        "Defensive design, clear failure handling, and reproducible execution.",
    },
  ],
  rules: [
    "Global eligibility: open to individual developers, research squads, and university students aged 18+.",
    "Fresh code commitment: core application code must be authored during the competition. Existing open-source libraries are permitted.",
    "Permissive open source: submissions must include a public repository and clear execution instructions.",
    "Team composition: teams of 1 to 5 members. Cross-disciplinary teams are encouraged.",
  ],
  guidebookUrl: null,
}
const additionalCompetitions: ReadonlyArray<
  Pick<
    Competition,
    | "id"
    | "slug"
    | "title"
    | "organizer"
    | "category"
    | "tag"
    | "icon"
    | "description"
  >
> = [
  {
    id: "defi",
    slug: "nextgen-defi-account-abstraction",
    title: "NextGen DeFi UX & Account Abstraction",
    organizer: "Arbitrum & Consensys",
    category: "Hackathon",
    tag: "Hackathon",
    icon: "landmark",
    description:
      "Redesign smart contract interactions using ERC-4337, session keys, and frictionless fiat-to-yield ramps.",
  },
  {
    id: "climate",
    slug: "biotech-clean-energy",
    title: "BioTech Clean Energy Innovation Cup",
    organizer: "MIT Energy Initiative",
    category: "Hackathon",
    tag: "Hardware & Climate",
    icon: "leaf",
    description:
      "Accelerate microbial fuel cell simulation, catalytic carbon capture materials, and edge sensor firmware.",
  },
  {
    id: "design",
    slug: "open-finance-design",
    title: "Open Finance Design Challenge",
    organizer: "Cobalt Design Collective",
    category: "Design & UX",
    tag: "Product Design",
    icon: "palette",
    description:
      "Make decentralized finance more understandable with inclusive interfaces and thoughtful onboarding.",
  },
  {
    id: "security",
    slug: "smart-contract-security",
    title: "Smart Contract Security Sprint",
    organizer: "Open Security Guild",
    category: "Cyber Security",
    tag: "Security",
    icon: "shield",
    description:
      "Build tools that help developers discover vulnerabilities and improve smart contract resilience.",
  },
  {
    id: "research",
    slug: "responsible-ai-builders",
    title: "Responsible AI Builders Challenge",
    organizer: "AI Research Collective",
    category: "AI & ML",
    tag: "Responsible AI",
    icon: "bot",
    description:
      "Create reliable evaluation tools and human-centered AI experiences with measurable impact.",
  },
  {
    id: "identity",
    slug: "digital-identity-hackathon",
    title: "Digital Identity Hackathon",
    organizer: "Identity Labs",
    category: "Hackathon",
    tag: "Identity",
    icon: "landmark",
    description:
      "Explore privacy-preserving identity and accessible credentials for everyday applications.",
  },
  {
    id: "accessibility",
    slug: "accessible-web-design",
    title: "Accessible Web Design Cup",
    organizer: "Inclusive Web Community",
    category: "Design & UX",
    tag: "Accessibility",
    icon: "palette",
    description:
      "Design welcoming web experiences that work across abilities, devices, and connection speeds.",
  },
  {
    id: "privacy",
    slug: "privacy-engineering-challenge",
    title: "Privacy Engineering Challenge",
    organizer: "Privacy Builders",
    category: "Cyber Security",
    tag: "Privacy",
    icon: "shield",
    description:
      "Develop practical tools that protect personal data while keeping applications useful.",
  },
  {
    id: "tools",
    slug: "developer-tools-hackathon",
    title: "Developer Tools Hackathon",
    organizer: "Cobalt Developer Community",
    category: "Hackathon",
    tag: "Dev Tools",
    icon: "landmark",
    description:
      "Help builders ship better software with new debugging, testing, and collaboration tools.",
  },
  {
    id: "education",
    slug: "ai-for-learning",
    title: "AI for Learning Challenge",
    organizer: "Open Learning Lab",
    category: "AI & ML",
    tag: "Education",
    icon: "bot",
    description:
      "Build transparent learning assistants that help students understand and explore new ideas.",
  },
  {
    id: "climate-data",
    slug: "climate-data-builders",
    title: "Climate Data Builders Sprint",
    organizer: "Climate Data Collective",
    category: "Hackathon",
    tag: "Climate",
    icon: "leaf",
    description:
      "Turn open environmental datasets into tools that support more informed local decisions.",
  },
]
export const mockCompetitions: readonly Competition[] = [
  baseCompetition,
  ...additionalCompetitions.map((item, index): Competition => ({
    ...baseCompetition,
    ...item,
    participants: index === 0 ? 890 : index === 1 ? 620 : 160 + index * 43,
    teamCount: index === 0 ? 195 : index === 1 ? 140 : 24 + index * 7,
    registrationEndsAt:
      index === 1 ? "2025-04-07T23:59:00Z" : baseCompetition.registrationEndsAt,
    status: index === 1 ? "closing-soon" : "registration-open",
    timeline: baseCompetition.timeline.map((stage) =>
      stage.id === "registration" && index === 1
        ? { ...stage, dateLabel: "Closes Apr 07 · 23:59 UTC" }
        : stage
    ),
  })),
]

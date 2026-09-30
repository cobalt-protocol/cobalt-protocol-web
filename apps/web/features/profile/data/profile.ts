import { isRecord } from "@/lib/type-guards"
import { skillLevels, type BuilderProfile, type BuilderSkill } from "../types"
export const profileStorageKey = "cobalt:profile:v1"

export const emptyProfile: BuilderProfile = {
  username: "",
  email: "",
  location: "",
  institution: "",
  pitch: "",
  github_link: "",
  linkedin_link: "",
  skills: [],
}

export const mockProfile: BuilderProfile = {
  username: "alexrivera_ai",
  email: "alexrivera_ai@example.com",
  location: "Jakarta",
  institution: "Harvard University",
  pitch:
    "I specialize in architecting stateful agent execution loops, sub-agent communication protocols, and cryptographic escrow integrations. Looking to join high-caliber squads for AI and Web3 infrastructure hackathons.",
  github_link: "https://github.com/alexrivera",
  linkedin_link: "https://linkedin.com/in/alexrivera",
  skills: [
    { name: "LangGraph & Multi-Agent", level: "Expert" },
    { name: "Rust", level: "Advanced" },
    { name: "Python / PyTorch", level: "Advanced" },
    { name: "Solidity / Stylus", level: "Intermediate" },
    { name: "TypeScript / Next.js", level: "Proficient" },
  ],
}
function isSkill(value: unknown): value is BuilderSkill {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    skillLevels.some((level) => level === value.level)
  )
}
export function isBuilderProfile(value: unknown): value is BuilderProfile {
  return (
    isRecord(value) &&
    ["username", "email", "location", "institution", "pitch"].every(
      (key) => typeof value[key] === "string"
    ) &&
    (value.github_link === undefined || typeof value.github_link === "string") &&
    (value.linkedin_link === undefined || typeof value.linkedin_link === "string") &&
    Array.isArray(value.skills) &&
    value.skills.length <= 20 &&
    value.skills.every(isSkill)
  )
}

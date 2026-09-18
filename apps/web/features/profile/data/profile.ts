import { isRecord } from "@/lib/type-guards"
import { skillLevels, type BuilderProfile, type BuilderSkill } from "../types"
export const profileStorageKey = "cobalt:profile:v1"
export const mockProfile: BuilderProfile = {
  username: "alexrivera_ai",
  email: "alexrivera_ai@example.com",
  location: "Jakarta",
  institution: "Harvard University",
  pitch:
    "I specialize in architecting stateful agent execution loops, sub-agent communication protocols, and cryptographic escrow integrations. Looking to join high-caliber squads for AI and Web3 infrastructure hackathons.",
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
    Array.isArray(value.skills) &&
    value.skills.length <= 20 &&
    value.skills.every(isSkill)
  )
}

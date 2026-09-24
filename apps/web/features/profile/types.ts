export const skillLevels = [
  "Intermediate",
  "Proficient",
  "Advanced",
  "Expert",
] as const
export type SkillLevel = (typeof skillLevels)[number]
export interface BuilderSkill {
  name: string
  level: SkillLevel
}
export interface BuilderProfile {
  username: string
  email: string
  location: string
  institution: string
  pitch: string
  skills: BuilderSkill[]
  github_link?: string
  linkedin_link?: string
}

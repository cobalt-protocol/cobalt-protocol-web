import type { BuilderProfile, BuilderSkill } from "@/features/profile/types"
import { mockProfile } from "@/features/profile/data/profile"
import type { User } from "./auth-api"

export interface ApiProfileData {
  id: string
  username?: string | null
  email?: string | null
  location?: string | null
  institution?: string | null
  pitch?: string | null
  description?: string | null
  github_link?: string | null
  linkedin_link?: string | null
  githubLink?: string | null
  linkedinLink?: string | null
  social_media?: {
    github_link?: string | null
    linkedin_link?: string | null
  } | null
  skill_description?: {
    description?: string | null
  } | null
  skills?: Array<{ name?: string; skill_name?: string; level?: string }>
  walletAddress?: string
}

export interface ApiProfileResponse {
  data: ApiProfileData
  message: string
  errors: any
}

export interface UpdateProfilePayload {
  username?: string
  email?: string
  location?: string
  institution?: string
  pitch?: string
  description?: string
  github_link?: string
  githubLink?: string
  linkedin_link?: string
  linkedinLink?: string
  social_media?: {
    github_link?: string
    linkedin_link?: string
  }
  skills?: Array<{ name: string; level?: string }>
}

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
const API_BASE_URL = rawApiUrl.endsWith("/api/v1")
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/$/, "")}/api/v1`

export async function getMyProfile(token: string): Promise<ApiProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/profiles/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Failed to get profile (${response.status})`
    try {
      const parsed = JSON.parse(errorText)
      if (parsed.message) {
        errorMessage += `: ${Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message}`
      }
    } catch {
      errorMessage += `: ${errorText.slice(0, 150)}`
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export async function updateMyProfile(
  token: string,
  payload: UpdateProfilePayload
): Promise<ApiProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/profiles/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Failed to update profile (${response.status})`
    try {
      const parsed = JSON.parse(errorText)
      if (parsed.message) {
        errorMessage += `: ${Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message}`
      }
    } catch {
      errorMessage += `: ${errorText.slice(0, 150)}`
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

import { emptyProfile } from "@/features/profile/data/profile"

export function mapApiProfileToBuilderProfile(
  apiData: ApiProfileData | User | any,
  fallback?: BuilderProfile
): BuilderProfile {
  if (!apiData) {
    return fallback || emptyProfile
  }

  const userObj = apiData.user || apiData

  const pitch =
    userObj.pitch ??
    userObj.description ??
    userObj.skill_description?.description ??
    ""

  const githubLink =
    userObj.github_link ??
    userObj.githubLink ??
    userObj.social_media?.github_link ??
    ""

  const linkedinLink =
    userObj.linkedin_link ??
    userObj.linkedinLink ??
    userObj.social_media?.linkedin_link ??
    ""

  const rawSkills: any[] = Array.isArray(userObj.skills)
    ? userObj.skills
    : userObj.skill
    ? [userObj.skill]
    : []

  const skills: BuilderSkill[] = rawSkills
    .map((s) => ({
      name: typeof s === "string" ? s : (s.name ?? s.skill_name ?? ""),
      level: (s.level as any) || "Intermediate",
    }))
    .filter((s) => s.name)

  const fallbackSkills = fallback?.skills?.length ? fallback.skills : []

  return {
    username: userObj.username ?? fallback?.username ?? "",
    email: userObj.email ?? fallback?.email ?? "",
    location: userObj.location ?? fallback?.location ?? "",
    institution: userObj.institution ?? fallback?.institution ?? "",
    pitch: pitch || fallback?.pitch || "",
    github_link: githubLink || fallback?.github_link || "",
    linkedin_link: linkedinLink || fallback?.linkedin_link || "",
    skills: skills.length > 0 ? skills : fallbackSkills,
  }
}


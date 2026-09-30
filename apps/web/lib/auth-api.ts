export type UserRole = "organization" | "user"

export interface User {
  id: string
  wallet_address: string
  username?: string | null
  email?: string | null
  location?: string | null
  institution?: string | null
  created_at?: string
  updated_at?: string | null
  deleted_at?: string | null
  role?: UserRole
  pitch?: string | null
  description?: string | null
  github_link?: string | null
  linkedin_link?: string | null
  social_media?: {
    github_link?: string | null
    linkedin_link?: string | null
  } | null
  skill_description?: {
    description?: string | null
  } | null
  skills?: Array<{ name?: string; skill_name?: string; level?: string }>
}

export interface NonceData {
  nonce: string
  user?: User
}

export interface NonceResponse {
  data: NonceData
  message: string
  errors: null | any
}

export interface VerifySignatureData {
  token: string
  user: User
}

export interface VerifySignatureResponse {
  data: VerifySignatureData
  message: string
  errors: null | any
}

export interface UserProfileData {
  user: User
}

export interface UserProfileResponse {
  data: UserProfileData
  message: string
  errors: null | any
}

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
const API_BASE_URL = rawApiUrl.endsWith("/api/v1")
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/$/, "")}/api/v1`

export async function generateNonce(
  walletAddress: string
): Promise<NonceResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/nonce`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ walletAddress }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Failed to generate nonce (${response.status})`
    try {
      const parsed = JSON.parse(errorText)
      if (parsed.message) {
        errorMessage += `: ${Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message}`
      }
    } catch {
      if (errorText.includes("<!DOCTYPE") || errorText.includes("<html")) {
        errorMessage += `: Server returned HTML error (Route Not Found)`
      } else {
        errorMessage += `: ${errorText.slice(0, 150)}`
      }
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export async function getExistingNonce(
  walletAddress: string
): Promise<NonceResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/nonce/existing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ walletAddress }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Failed to fetch existing nonce (${response.status})`
    try {
      const parsed = JSON.parse(errorText)
      if (parsed.message) {
        errorMessage += `: ${Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message}`
      }
    } catch {
      if (errorText.includes("<!DOCTYPE") || errorText.includes("<html")) {
        errorMessage += `: Server returned HTML error (Route Not Found)`
      } else {
        errorMessage += `: ${errorText.slice(0, 150)}`
      }
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export async function verifySignature(params: {
  walletAddress: string
  signature: string
  nonce?: string
  message?: string
}): Promise<VerifySignatureResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/verify/nonce`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Failed to verify signature (${response.status})`
    try {
      const parsed = JSON.parse(errorText)
      if (parsed.message) {
        errorMessage += `: ${Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message}`
      }
    } catch {
      if (errorText.includes("<!DOCTYPE") || errorText.includes("<html")) {
        errorMessage += `: Server returned HTML error (Route Not Found)`
      } else {
        errorMessage += `: ${errorText.slice(0, 150)}`
      }
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export async function getMe(token: string): Promise<UserProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
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
      if (errorText.includes("<!DOCTYPE") || errorText.includes("<html")) {
        errorMessage += `: Server returned HTML error (Route Not Found)`
      } else {
        errorMessage += `: ${errorText.slice(0, 150)}`
      }
    }
    throw new Error(errorMessage)
  }

  return response.json()
}


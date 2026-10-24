const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
export const API_BASE_URL = rawApiUrl.endsWith("/api/v1")
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/$/, "")}/api/v1`

export interface DashboardDeposited {
  price_usd: number
  price_idr: number
}

export interface DashboardData {
  deposited: DashboardDeposited
  total_builders?: number
}

export interface DashboardResponse {
  data?: {
    deposited: DashboardDeposited
    total_builders?: number
  }
  deposited?: DashboardDeposited
  total_builders?: number
  message?: string
  errors?: any
}

export async function fetchDashboard(): Promise<DashboardData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/dashboard`, {
      cache: "no-store",
    })
    if (!res.ok) {
      return null
    }
    const json: DashboardResponse = await res.json()
    const deposited = json?.data?.deposited ?? json?.deposited
    if (!deposited) return null

    const total_builders = json?.data?.total_builders ?? json?.total_builders

    return {
      deposited,
      total_builders,
    }
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error)
    return null
  }
}


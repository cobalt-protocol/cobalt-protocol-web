import { proxyOrganizerRequest } from "@/lib/api/backend-proxy"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params
  return proxyOrganizerRequest(
    `organizer/competitions/${encodeURIComponent(id)}/publish`,
    { method: "POST" }
  )
}

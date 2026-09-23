import { proxyOrganizerRequest } from "@/lib/api/backend-proxy"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  return proxyOrganizerRequest(
    `organizer/competitions/${encodeURIComponent(id)}`
  )
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params
  return proxyOrganizerRequest(
    `organizer/competitions/${encodeURIComponent(id)}`,
    { method: "PATCH", body: await request.text() }
  )
}

import { proxyOrganizerRequest } from "@/lib/api/backend-proxy"

export async function GET(request: Request) {
  const query = new URL(request.url).search
  return proxyOrganizerRequest(`organizer/competitions${query}`)
}

export async function POST(request: Request) {
  return proxyOrganizerRequest("organizer/competitions", {
    method: "POST",
    body: await request.text(),
  })
}

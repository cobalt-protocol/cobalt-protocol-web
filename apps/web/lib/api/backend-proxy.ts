import "server-only"

const defaultApiUrl = "http://localhost:3001/api/v1"
const defaultOrganizerToken =
  "dummy-organization-access-token-for-testing-123456789"

function apiUrl(path: string) {
  const baseUrl = process.env.COBALT_API_URL ?? defaultApiUrl
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`
}

export async function proxyOrganizerRequest(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const token =
    process.env.COBALT_ORGANIZER_TOKEN ??
    (process.env.NODE_ENV === "production" ? undefined : defaultOrganizerToken)
  if (!token) {
    return Response.json(
      {
        error: {
          code: "SERVER_MISCONFIGURED",
          message: "Organizer API token is not configured",
        },
      },
      { status: 500 }
    )
  }

  try {
    const headers = new Headers(init.headers)
    headers.set("Accept", "application/json")
    headers.set("Authorization", `Bearer ${token}`)
    if (init.body) headers.set("Content-Type", "application/json")

    const upstream = await fetch(apiUrl(path), {
      ...init,
      cache: "no-store",
      headers,
    })
    const body = await upstream.text()

    return new Response(body || null, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    })
  } catch {
    return Response.json(
      {
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "Cobalt API is unavailable",
        },
      },
      { status: 502 }
    )
  }
}

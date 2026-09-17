export const routes = {
  home: "/",
  competitions: "/competitions",
  profile: "/profile",
  competition: (slug: string) => `/competitions/${encodeURIComponent(slug)}`,
  workspace: (slug: string) => `/my-competitions/${encodeURIComponent(slug)}`,
} as const

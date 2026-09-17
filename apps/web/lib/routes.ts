export const routes = {
  home: "/",
  competitions: "/competitions",
  profile: "/profile",
  organization: "/organization",
  competition: (slug: string) => `/competitions/${encodeURIComponent(slug)}`,
  workspace: (slug: string) => `/my-competitions/${encodeURIComponent(slug)}`,
} as const

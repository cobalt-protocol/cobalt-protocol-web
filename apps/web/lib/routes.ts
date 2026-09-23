export const routes = {
  home: "/",
  competitions: "/competitions",
  profile: "/profile",
  dashboard: "/dashboard",
  organization: "/organization",
  createCompetition: "/competition/create",
  competition: (id: string) => `/competition/${encodeURIComponent(id)}`,
  joinTeam: (slug: string) =>
    `/competitions/${encodeURIComponent(slug)}/join-team`,
  workspace: (slug: string) => `/my-competitions/${encodeURIComponent(slug)}`,
} as const

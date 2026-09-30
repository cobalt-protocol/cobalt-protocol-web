export const routes = {
  home: "/",
  competitions: "/competitions",
  profile: "/profile",
  dashboard: "/dashboard",
  organization: "/organization",
  createCompetition: "/competition/create",
  competition: (id: string) => `/competitions/${encodeURIComponent(id)}`,
  joinTeam: (slug: string) =>
    `/competitions/${encodeURIComponent(slug)}/join-team`,
  workspace: (id: string) => `/my-competitions/${encodeURIComponent(id)}`,
} as const

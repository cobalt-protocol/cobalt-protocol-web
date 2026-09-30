export const routes = {
  home: "/",
  competitions: "/competition",
  profile: "/profile",
  dashboard: "/dashboard",
  organization: "/organization/competition",
  createCompetition: "/organization/competition/create",
  competition: (id: string) => `/competition/${encodeURIComponent(id)}`,
  organizationCompetition: (id: string) => `/organization/competition/${encodeURIComponent(id)}`,
  joinTeam: (id: string) =>
    `/competition/${encodeURIComponent(id)}/join-team`,
  organizationTeamDetail: (id: string) =>
    `/organization/competition/${encodeURIComponent(id)}/team-detail`,
  organizationWinner: (id: string) =>
    `/organization/competition/${encodeURIComponent(id)}/winner`,
  workspace: (id: string) => `/my-competition/${encodeURIComponent(id)}`,
} as const


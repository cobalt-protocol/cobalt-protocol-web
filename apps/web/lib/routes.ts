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
  organizationTeamDetail: (id: string, teamId?: string) =>
    teamId
      ? `/organization/competition/${encodeURIComponent(id)}/team-detail?teamId=${encodeURIComponent(teamId)}`
      : `/organization/competition/${encodeURIComponent(id)}/team-detail`,
  organizationWinner: (id: string) =>
    `/organization/competition/${encodeURIComponent(id)}/winner`,
  workspace: (id: string) => `/my-competition/${encodeURIComponent(id)}`,
  explorer: {
    tx: (chainId: number, hash: string) => {
      // mapping chain id to explorer url (fallback botchain testnet)
      const base = chainId === 968 ? "https://testnet.botscan.app" : "https://testnet.botscan.app"
      return `${base}/tx/${hash}`
    }
  },
} as const


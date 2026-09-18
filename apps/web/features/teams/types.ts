export interface TeamListing {
  id: string
  name: string
  lead: string
  memberCount: number
  description: string
  roles: readonly string[]
  matchScore: number
}

import type { TeamAction, TeamState } from "../types"
export function teamReducer(state: TeamState, action: TeamAction): TeamState {
  switch (action.type) {
    case "rename": {
      const name = action.name.trim()
      return name ? { ...state, name } : state
    }
    case "update-details": {
      const name = action.name.trim()
      return {
        ...state,
        ...(name ? { name } : {}),
        description: action.description,
        visibility: action.visibility,
        skills: action.skills,
      }
    }
    case "remove-member":
      return {
        ...state,
        members: state.members.filter(
          (member) => member.id !== action.memberId || member.role === "lead"
        ),
      }
    case "set-team":
      return action.team
  }
}

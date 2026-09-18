import type { TeamAction, TeamState } from "../types"
export function teamReducer(state: TeamState, action: TeamAction): TeamState {
  switch (action.type) {
    case "rename": {
      const name = action.name.trim()
      return name ? { ...state, name } : state
    }
    case "remove-member":
      return {
        ...state,
        members: state.members.filter(
          (member) => member.id !== action.memberId || member.role === "lead"
        ),
      }
    case "decline-request":
      return {
        ...state,
        requests: state.requests.filter(
          (request) => request.id !== action.requestId
        ),
      }
    case "accept-request": {
      const request = state.requests.find(
        (item) => item.id === action.requestId
      )
      if (
        !request ||
        state.members.length >= action.capacity ||
        state.members.some((member) => member.id === request.member.id)
      )
        return state
      return {
        ...state,
        members: [...state.members, request.member],
        requests: state.requests.filter((item) => item.id !== action.requestId),
      }
    }
  }
}

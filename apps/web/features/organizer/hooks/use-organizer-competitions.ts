"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createOrganizerCompetition,
  getOrganizerCompetition,
  listOrganizerCompetitions,
  publishOrganizerCompetition,
  updateOrganizerCompetition,
} from "../api/client"
import type {
  OrganizerCompetitionInput,
  OrganizerCompetitionStatus,
} from "../api/contracts"

export const organizerCompetitionKeys = {
  all: ["organizer", "competitions"] as const,
  list: (status?: OrganizerCompetitionStatus) =>
    [...organizerCompetitionKeys.all, "list", status ?? "ALL"] as const,
  detail: (id: string) =>
    [...organizerCompetitionKeys.all, "detail", id] as const,
}

export function useOrganizerCompetitions(status?: OrganizerCompetitionStatus) {
  return useQuery({
    queryKey: organizerCompetitionKeys.list(status),
    queryFn: () => listOrganizerCompetitions(status),
  })
}

export function useOrganizerCompetition(id: string) {
  return useQuery({
    queryKey: organizerCompetitionKeys.detail(id),
    queryFn: () => getOrganizerCompetition(id),
    enabled: Boolean(id),
  })
}

export function useCreateOrganizerCompetition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: OrganizerCompetitionInput) =>
      createOrganizerCompetition(input),
    onSuccess: (competition) => {
      queryClient.setQueryData(
        organizerCompetitionKeys.detail(competition.id),
        competition
      )
      void queryClient.invalidateQueries({
        queryKey: organizerCompetitionKeys.all,
      })
    },
  })
}

export function useUpdateOrganizerCompetition(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<OrganizerCompetitionInput>) =>
      updateOrganizerCompetition(id, input),
    onSuccess: (competition) => {
      queryClient.setQueryData(
        organizerCompetitionKeys.detail(id),
        competition
      )
      void queryClient.invalidateQueries({
        queryKey: organizerCompetitionKeys.all,
      })
    },
  })
}

export function usePublishOrganizerCompetition(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => publishOrganizerCompetition(id),
    onSuccess: (competition) => {
      queryClient.setQueryData(
        organizerCompetitionKeys.detail(id),
        competition
      )
      void queryClient.invalidateQueries({
        queryKey: organizerCompetitionKeys.all,
      })
    },
  })
}

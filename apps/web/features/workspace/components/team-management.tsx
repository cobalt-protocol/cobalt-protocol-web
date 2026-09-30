"use client"
import { useEffect, useReducer, useState } from "react"
import { Pencil, Trash2, Users } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Badge,
  Panel,
  SectionHeading,
  fieldClass,
} from "@/components/ui/page-primitives"
import { Modal } from "@/components/ui/modal"
import { mockTeam } from "../data/workspace"
import { teamReducer } from "../lib/team-reducer"
import type { TeamState } from "../types"
import { parseCapacityFromFormation } from "@/lib/competitions-api"

export function TeamManagement({
  capacity,
  formation,
  initialTeam = mockTeam,
  isLeader = true,
  onRename,
  onUpdateTeam,
  onAcceptRequest,
  onDeclineRequest,
}: {
  capacity: number
  formation?: string
  initialTeam?: TeamState
  isLeader?: boolean
  onRename?: (name: string) => boolean
  onUpdateTeam?: (payload: {
    name?: string
    description?: string
    visibility?: boolean
    skills_suggestions?: string[]
  }) => Promise<{ success: boolean; error?: string }>
  onAcceptRequest?: (requestId: string) => Promise<boolean | void>
  onDeclineRequest?: (requestId: string) => Promise<boolean | void>
}) {
  const [team, dispatch] = useReducer(teamReducer, initialTeam)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description || "")
  const [visibility, setVisibility] = useState<boolean>(team.visibility ?? true)
  const [skillsInput, setSkillsInput] = useState((team.skills || []).join(", "))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState("")
  const [removing, setRemoving] = useState<string | null>(null)
  const [feedback, setFeedback] = useState("")

  useEffect(() => {
    dispatch({ type: "set-team", team: initialTeam })
  }, [initialTeam])
  const effectiveCapacity = formation ? parseCapacityFromFormation(formation, capacity) : capacity
  const remaining = Math.max(0, effectiveCapacity - team.members.length)
  return (
    <>
      <Panel>
        <SectionHeading
          title="Active Squad & Member Roster"
          description="Manage active squad members, administrative permissions, and team metadata."
          aside={
            <Badge>
              {team.members.length}/{effectiveCapacity} Members ({remaining}{" "}
              {remaining === 1 ? "Slot" : "Slots"} Available)
            </Badge>
          }
        />
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-slate-50 p-4">
          <span className="rounded-lg bg-primary p-3 text-white">
            <Users size={20} />
          </span>
          <div>
            <h3 className="text-sm font-bold">{team.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {team.description || "Primary track: Autonomous Agent Frameworks & Multi-Agent Consensus"}
            </p>
            {team.skills && team.skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {team.skills.map((skill) => (
                  <Badge key={skill} tone="neutral">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {isLeader && (
            <Button
              variant="outline"
              className="ml-auto"
              onClick={() => {
                setName(team.name)
                setDescription(team.description || "")
                setVisibility(team.visibility ?? true)
                setSkillsInput((team.skills || []).join(", "))
                setModalError("")
                setEditing(true)
              }}
            >
              <Pencil size={13} />
              Edit Team Profile
            </Button>
          )}
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          {team.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 border-b border-border/50 p-4 last:border-0"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-primary">
                {member.initials}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {member.name}{" "}
                  {member.role === "lead" && <Badge>Team Lead</Badge>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {member.email}
                </p>
              </div>
              {member.role === "lead" ? (
                <span className="ml-auto text-[10px] text-muted-foreground">
                  Leader
                </span>
              ) : isLeader ? (
                <Button
                  variant="outline"
                  aria-label={`Remove ${member.name}`}
                  className="ml-auto text-red-600"
                  onClick={() => setRemoving(member.id)}
                >
                  <Trash2 size={12} />
                  Remove
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <SectionHeading
          title="Incoming Join Requests & Builder Pitches"
          description="Review candidates before accepting them into your squad."
          aside={
            <Badge>
              {team.requests.length} Pending · {remaining} Slots Remaining
            </Badge>
          }
        />
        <div className="space-y-4">
          {team.requests.map((request) => (
            <article
              key={request.id}
              className="rounded-xl border border-border bg-slate-50/70 p-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {request.member.initials}
                </span>
                <div>
                  <h3 className="text-sm font-bold">
                    {request.member.name} <Badge>{request.specialty}</Badge>
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {request.location}
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (onDeclineRequest) {
                        await onDeclineRequest(request.id)
                      }
                      dispatch({
                        type: "decline-request",
                        requestId: request.id,
                      })
                      setFeedback(
                        `Declined ${request.member.name}.`
                      )
                    }}
                  >
                    Decline
                  </Button>
                  <Button
                    disabled={remaining === 0}
                    onClick={async () => {
                      if (onAcceptRequest) {
                        await onAcceptRequest(request.id)
                      }
                      dispatch({
                        type: "accept-request",
                        requestId: request.id,
                        capacity,
                      })
                      setFeedback(
                        `Accepted ${request.member.name} into the squad.`
                      )
                    }}
                  >
                    Accept to Squad
                  </Button>
                </div>
              </div>
              <div className="my-4 rounded-lg border border-border/50 bg-white p-3">
                <p className="text-xs font-bold">
                  ⚡ Builder Pitch & What I Bring
                </p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {request.pitch}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {request.skills.map((skill) => (
                  <Badge key={skill} tone="neutral">
                    {skill}
                  </Badge>
                ))}
              </div>
            </article>
          ))}
          {team.requests.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No pending join requests.
            </p>
          )}
        </div>
        <p role="status" className="mt-4 text-xs text-teal-700">
          {feedback}
        </p>
      </Panel>
      {isLeader && (
        <Modal title="Edit Team Profile" open={editing} onOpenChange={setEditing}>
          <form
            onSubmit={async (event) => {
              event.preventDefault()
              if (!name.trim()) return

              setIsSubmitting(true)
              setModalError("")

              const parsedSkills = skillsInput
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)

              if (onUpdateTeam) {
                const res = await onUpdateTeam({
                  name: name.trim(),
                  description: description.trim(),
                  visibility,
                  skills_suggestions: parsedSkills,
                })

                if (!res.success) {
                  setModalError(res.error || "Failed to update team profile")
                  setIsSubmitting(false)
                  return
                }
              } else if (onRename) {
                if (!onRename(name.trim())) {
                  setModalError(
                    "Could not save the team name. Use up to 24 characters and check browser storage."
                  )
                  setIsSubmitting(false)
                  return
                }
              }

              dispatch({
                type: "update-details",
                name: name.trim(),
                description: description.trim(),
                visibility,
                skills: parsedSkills,
              })
              setFeedback("Team profile updated successfully.")
              setIsSubmitting(false)
              setEditing(false)
            }}
            className="space-y-4 pt-2"
          >
            {modalError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {modalError}
              </div>
            )}

            <label className="block text-sm font-semibold">
              Team name <span className="text-red-500">*</span>
              <input
                className={fieldClass + " mt-1.5"}
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Cyber Warriors"
              />
            </label>

            <label className="block text-sm font-semibold">
              Team description
              <textarea
                className={fieldClass + " mt-1.5 min-h-[80px] resize-y py-2"}
                rows={3}
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe your team focus, goals, or background..."
              />
            </label>

            <label className="block text-sm font-semibold">
              Team visibility
              <select
                className={fieldClass + " mt-1.5"}
                value={visibility ? "public" : "private"}
                onChange={(event) => setVisibility(event.target.value === "public")}
              >
                <option value="public">Public (Visible to everyone)</option>
                <option value="private">Private (Invite only)</option>
              </select>
            </label>

            <label className="block text-sm font-semibold">
              Skills needed / suggestions <span className="text-xs font-normal text-muted-foreground">(comma separated)</span>
              <input
                className={fieldClass + " mt-1.5"}
                value={skillsInput}
                onChange={(event) => setSkillsInput(event.target.value)}
                placeholder="e.g. Smart Contracts, Frontend, AI/ML"
              />
            </label>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? "Saving..." : "Save Team Profile"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      <Modal
        title="Remove team member?"
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null)
        }}
      >
        <p className="mt-4 text-sm text-muted-foreground">
          This removes{" "}
          {team.members.find((member) => member.id === removing)?.name} from the
          preview roster.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setRemoving(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (removing)
                dispatch({ type: "remove-member", memberId: removing })
              setRemoving(null)
              setFeedback("Member removed from the preview squad.")
            }}
          >
            Remove member
          </Button>
        </div>
      </Modal>
    </>
  )
}

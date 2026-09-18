"use client"
import { useReducer, useState } from "react"
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
export function TeamManagement({ capacity }: { capacity: number }) {
  const [team, dispatch] = useReducer(teamReducer, mockTeam)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(team.name)
  const [removing, setRemoving] = useState<string | null>(null)
  const [feedback, setFeedback] = useState("")
  const remaining = Math.max(0, capacity - team.members.length)
  return (
    <>
      <Panel>
        <SectionHeading
          title="Active Squad & Member Roster"
          description="Manage active squad members, administrative permissions, and team metadata."
          aside={
            <Badge>
              {team.members.length}/{capacity} Members ({remaining} Slots
              Available)
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
              Primary track: Autonomous Agent Frameworks & Multi-Agent Consensus
            </p>
          </div>
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => {
              setName(team.name)
              setEditing(true)
            }}
          >
            <Pencil size={13} />
            Edit Team Profile
          </Button>
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
                  Squad Owner
                </span>
              ) : (
                <Button
                  variant="outline"
                  aria-label={`Remove ${member.name}`}
                  className="ml-auto text-red-600"
                  onClick={() => setRemoving(member.id)}
                >
                  <Trash2 size={12} />
                  Remove
                </Button>
              )}
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
                    onClick={() => {
                      dispatch({
                        type: "decline-request",
                        requestId: request.id,
                      })
                      setFeedback(
                        `Declined ${request.member.name} in this preview.`
                      )
                    }}
                  >
                    Decline
                  </Button>
                  <Button
                    disabled={remaining === 0}
                    onClick={() => {
                      dispatch({
                        type: "accept-request",
                        requestId: request.id,
                        capacity,
                      })
                      setFeedback(
                        `Accepted ${request.member.name} into the preview squad.`
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
      <Modal title="Edit Team Profile" open={editing} onOpenChange={setEditing}>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!name.trim()) return
            dispatch({ type: "rename", name })
            setEditing(false)
          }}
        >
          <label className="mt-5 block text-sm font-semibold">
            Team name
            <input
              className={fieldClass + " mt-2"}
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <Button type="submit" className="mt-5 h-10 w-full">
            Save team name
          </Button>
        </form>
      </Modal>
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

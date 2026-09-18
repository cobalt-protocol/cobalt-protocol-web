"use client"
import { useSiteActions } from "@/components/layout/site-actions"
import {
  Badge,
  Panel,
  SectionHeading,
  fieldClass,
} from "@/components/ui/page-primitives"
import { Button } from "@workspace/ui/components/button"
import {
  AtSign,
  CloudUpload,
  Pencil,
  Plus,
  SquareTerminal,
  UserRound,
  X,
} from "lucide-react"
import { useState, type FormEvent } from "react"
import { skillLevels, type BuilderProfile, type SkillLevel } from "../types"

export function ProfileEditor({
  initialProfile,
  onSave,
}: {
  initialProfile: BuilderProfile
  onSave: (profile: BuilderProfile) => boolean
}) {
  const [profile, setProfile] = useState(initialProfile)
  const [editing, setEditing] = useState(false)
  const [skillName, setSkillName] = useState("")
  const [level, setLevel] = useState<SkillLevel>("Intermediate")
  const [feedback, setFeedback] = useState("")
  const { openWallet } = useSiteActions()
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = {
      ...profile,
      username: profile.username.trim(),
      email: profile.email.trim(),
      location: profile.location.trim(),
      institution: profile.institution.trim(),
      pitch: profile.pitch.trim(),
    }
    if (!next.username || !next.location || !next.institution || !next.pitch) {
      setFeedback("Please complete all profile fields.")
      return
    }
    if (!onSave(next)) {
      setFeedback(
        "Browser storage is unavailable. Your changes are still in the form; please try saving again."
      )
      return
    }
    setEditing(false)
  }
  function addSkill() {
    const name = skillName.trim()
    if (!name) {
      setFeedback("Enter a skill name first.")
      return
    }
    if (
      profile.skills.length >= 20 ||
      profile.skills.some(
        (skill) => skill.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      setFeedback("Use a unique skill name, up to 20 skills.")
      return
    }
    setProfile((current) => ({
      ...current,
      skills: [...current.skills, { name, level }],
    }))
    setSkillName("")
    setFeedback("")
  }
  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid items-stretch gap-5 lg:grid-cols-[.65fr_1.4fr_1fr]">
        <Panel className="flex min-h-52 items-center justify-center bg-gradient-to-br from-blue-700 to-slate-950 text-white">
          <div className="text-center">
            <UserRound size={70} className="mx-auto opacity-70" />
            <p className="mt-4 text-sm font-semibold">@{profile.username}</p>
            <p className="mt-1 text-[10px] text-blue-200">Builder profile</p>
          </div>
        </Panel>
        <Panel>
          <SectionHeading title="Linked Accounts" />
          <div className="space-y-3">
            {[
              { label: "GitHub", icon: SquareTerminal },
              { label: "LinkedIn", icon: AtSign },
            ].map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"
              >
                <Icon size={23} className="text-primary" />
                <div>
                  <h3 className="text-sm font-bold">{label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Account linking coming soon
                  </p>
                </div>
                <span className="ml-auto">
                  <Badge tone="neutral">Not linked</Badge>
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="flex justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase">
              Web3 settlement vault
            </h2>
            <Badge tone="neutral">Not connected</Badge>
          </div>
          <div className="my-5 rounded-xl bg-secondary/60 p-4">
            <p className="text-xs">Arbitrum One</p>
            <p className="mt-3 text-sm font-bold">
              Connect your wallet to view vault
            </p>
          </div>
          <Button type="button" onClick={openWallet} className="h-10 w-full">
            Connect Wallet
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Balance is unavailable until a wallet is connected.
          </p>
        </Panel>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          className="h-11 px-5"
          onClick={() => {
            setEditing(!editing)
            setFeedback("")
            if (editing) setProfile(initialProfile)
          }}
        >
          <Pencil size={16} />
          {editing ? "Cancel Editing" : "Edit Profile"}
        </Button>
        <Button type="submit" disabled={!editing} className="h-11 px-5">
          <CloudUpload size={16} />
          Save Changes
        </Button>
        {feedback && (
          <p role="status" className="text-sm text-amber-800">
            {feedback}
          </p>
        )}
      </div>
      <Panel>
        <SectionHeading title="Personal & Academic Profile" />
        <div className="grid gap-5 md:grid-cols-2">
          {(
            [
              { key: "username", label: "Username", type: "text" },
              { key: "email", label: "Email", type: "email" },
              { key: "location", label: "Location", type: "text" },
              { key: "institution", label: "Institution", type: "text" },
            ] as const
          ).map(({ key, label, type }) => (
            <label key={key} className="space-y-2 text-sm font-semibold">
              <span>{label}</span>
              <input
                className={fieldClass}
                name={key}
                type={type}
                required
                maxLength={150}
                readOnly={!editing}
                value={profile[key]}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
              />
            </label>
          ))}
        </div>
      </Panel>
      <Panel>
        <SectionHeading
          title="Skills & Matchmaking Intelligence"
          description="Describe your strengths so future teammates can get to know you."
          aside={<Badge tone="neutral">Matching preview</Badge>}
        />
        <p className="mb-3 text-sm font-semibold">
          Core Engineering Stack & Level
        </p>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <span
              key={skill.name}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary/70 px-3 py-2 text-xs font-semibold"
            >
              {skill.name}
              <Badge>{skill.level}</Badge>
              {editing && (
                <button
                  type="button"
                  aria-label={`Remove ${skill.name}`}
                  onClick={() =>
                    setProfile((current) => ({
                      ...current,
                      skills: current.skills.filter(
                        (item) => item.name !== skill.name
                      ),
                    }))
                  }
                >
                  <X size={14} />
                </button>
              )}
            </span>
          ))}
        </div>
        {editing && (
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              aria-label="New skill name"
              className={fieldClass + " max-w-64"}
              placeholder="Add a skill"
              maxLength={60}
              value={skillName}
              onChange={(event) => setSkillName(event.target.value)}
            />
            <select
              aria-label="Skill level"
              value={level}
              className={fieldClass + " w-auto"}
              onChange={(event) => {
                const selectedLevel = skillLevels.find(
                  (item) => item === event.target.value
                )
                if (selectedLevel) setLevel(selectedLevel)
              }}
            >
              {skillLevels.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <Button
              type="button"
              className="h-11"
              variant="secondary"
              onClick={addSkill}
            >
              <Plus size={16} />
              Add skill
            </Button>
          </div>
        )}
        <label className="mt-7 block text-sm font-semibold">
          <span>What I Can Contribute to a Team (Builder Pitch)</span>
          <textarea
            className={fieldClass + " mt-2 min-h-32 leading-7"}
            required
            maxLength={2000}
            readOnly={!editing}
            value={profile.pitch}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                pitch: event.target.value,
              }))
            }
          />
        </label>
      </Panel>
    </form>
  )
}

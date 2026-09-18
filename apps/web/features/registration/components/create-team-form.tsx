"use client"
import { useState, type FormEvent } from "react"
import { Globe2, LockKeyhole, Sparkles, UserPlus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { fieldClass } from "@/components/ui/page-primitives"
import type { BuilderProfile } from "@/features/profile/types"
import type { CreateTeamInput, RegistrationCompetition } from "../types"
import { validateCreateTeam } from "../lib/registration-validation"
const suggestions = [
  "UI/UX Designer",
  "ML / PyTorch",
  "Rust / Stylus",
  "Web3 Smart Contracts",
]
export function CreateTeamForm({
  competition,
  profile,
  onCancel,
  onCreate,
}: {
  competition: RegistrationCompetition
  profile: BuilderProfile
  onCancel: () => void
  onCreate: (input: CreateTeamInput) => string | null
}) {
  const [input, setInput] = useState<CreateTeamInput>({
    name: "",
    visibility: "public",
    requirements: "",
  })
  const [error, setError] = useState("")
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = validateCreateTeam(input)
    if (validation) {
      setError(validation)
      return
    }
    setError(onCreate(input) ?? "")
  }
  return (
    <form onSubmit={submit}>
      <p className="mt-2 text-xs text-muted-foreground">
        <span className="text-primary">{competition.title}</span> · Max{" "}
        {competition.maxTeamSize} members
      </p>
      <label className="mt-7 block text-sm font-semibold">
        <span className="flex justify-between gap-3">
          Team Name{" "}
          <span className="text-xs font-normal text-muted-foreground">
            {input.name.length}/24 chars
          </span>
        </span>
        <input
          autoComplete="off"
          required
          maxLength={24}
          value={input.name}
          onChange={(event) => setInput({ ...input, name: event.target.value })}
          className={fieldClass + " mt-2 bg-secondary/60"}
          placeholder="e.g. SwarmSynthetix, NexusAgents, NeuralOps"
        />
      </label>
      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-semibold">Team Visibility</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              {
                value: "public",
                title: "Public Team",
                description:
                  "Discoverable in the competition team directory. Any participant can request to join. Find complementary builders for your squad.",
                caption: "● AI matching preview",
                icon: Globe2,
              },
              {
                value: "private",
                title: "Private Team",
                description:
                  "Hidden from the public directory. Teammates can join using a unique invite code generated for your team.",
                caption: "Invite Code Only",
                icon: LockKeyhole,
              },
            ] as const
          ).map(({ value, title, description, caption, icon: Icon }) => (
            <label
              key={value}
              className="cursor-pointer rounded-2xl border border-transparent bg-secondary/60 p-4 has-[:checked]:border-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary"
            >
              <span className="flex items-center gap-2">
                <Icon size={20} className="text-primary" />
                <strong className="text-sm">{title}</strong>
                <input
                  type="radio"
                  name="visibility"
                  value={value}
                  checked={input.visibility === value}
                  onChange={() => setInput({ ...input, visibility: value })}
                  className="ml-auto size-4 accent-blue-600"
                />
              </span>
              <span className="mt-3 block text-xs leading-6 text-muted-foreground">
                {description}
              </span>
              <span className="mt-3 block text-xs text-teal-700">
                {caption}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <section className="mt-6 rounded-2xl bg-secondary/60 p-5">
        <label
          className="block text-sm font-semibold"
          htmlFor="team-requirements"
        >
          <Sparkles size={16} className="mr-1 inline text-primary" />
          What does your team need? (Roles & Skill Requirements)
        </label>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          Describe the specific skills, technologies, or roles you are looking
          for.
        </p>
        <textarea
          id="team-requirements"
          required
          maxLength={2000}
          rows={4}
          className={fieldClass + " mt-3 bg-white"}
          value={input.requirements}
          onChange={(event) =>
            setInput({ ...input, requirements: event.target.value })
          }
          placeholder="Looking for a UI/UX designer and a machine learning engineer..."
        />
        <p className="mt-4 text-[10px] text-muted-foreground uppercase">
          Quick suggestions (tap to append)
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="rounded-full bg-blue-100 px-3 py-1 text-xs disabled:opacity-50"
              disabled={
                input.requirements.includes(suggestion) ||
                input.requirements.length + suggestion.length + 2 > 2000
              }
              onClick={() =>
                setInput({
                  ...input,
                  requirements: [input.requirements.trim(), suggestion]
                    .filter(Boolean)
                    .join(", "),
                })
              }
            >
              + {suggestion}
            </button>
          ))}
        </div>
      </section>
      <div className="mt-6 flex items-center gap-3 rounded-xl bg-blue-50 p-4">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {profile.username.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <strong className="text-sm">@{profile.username}</strong>
          <p className="mt-1 text-xs text-muted-foreground">
            {profile.institution}
          </p>
        </div>
        <span className="ml-auto rounded-full bg-white px-3 py-1 text-xs font-bold">
          Team Lead
        </span>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="mt-7 flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          className="h-11 px-5"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" className="h-11 px-5">
          <UserPlus size={17} />
          Create Team
        </Button>
      </div>
    </form>
  )
}

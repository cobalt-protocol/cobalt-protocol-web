"use client"
import { useState, type FormEvent } from "react"
import { Check, Globe2, Loader2, LockKeyhole, Plus, Sparkles, UserPlus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { fieldClass } from "@/components/ui/page-primitives"
import type { BuilderProfile } from "@/features/profile/types"
import type { CreateTeamInput, RegistrationCompetition } from "../types"
import { validateCreateTeam } from "../lib/registration-validation"
const defaultSuggestions = [
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
  onCreate: (input: CreateTeamInput) => Promise<string | null> | string | null
}) {
  const [input, setInput] = useState<CreateTeamInput>({
    name: "",
    visibility: "public",
    requirements: "",
  })
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function handleAddCustomTag() {
    const trimmed = customTag.trim()
    if (!trimmed) return
    if (!suggestions.includes(trimmed)) {
      setSuggestions((prev) => [...prev, trimmed])
    }
    if (!selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed])
    }
    setCustomTag("")
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload: CreateTeamInput = {
      ...input,
      skills: selectedTags,
    }
    const validation = validateCreateTeam(payload)
    if (validation) {
      setError(validation)
      return
    }
    setError("")
    setIsSubmitting(true)
    try {
      const resErr = await onCreate(payload)
      if (resErr) {
        setError(resErr)
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create team")
    } finally {
      setIsSubmitting(false)
    }
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
          maxLength={2000}
          rows={3}
          className={fieldClass + " mt-3 bg-white"}
          value={input.requirements}
          onChange={(event) =>
            setInput({ ...input, requirements: event.target.value })
          }
          placeholder="Looking for a UI/UX designer and a machine learning engineer..."
        />
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Quick suggestion tags (tap to select/unselect)
          </p>
          {selectedTags.length > 0 && (
            <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              {selectedTags.length} tag(s) selected
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => {
            const isSelected = selectedTags.includes(suggestion)
            return (
              <button
                key={suggestion}
                type="button"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${isSelected
                    ? "bg-teal-600 text-white shadow-sm hover:bg-teal-700 ring-2 ring-teal-600/30"
                    : "bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200/70"
                  }`}
                onClick={() => toggleTag(suggestion)}
              >
                {isSelected ? <Check size={12} className="stroke-[2.5]" /> : <Plus size={12} />}
                <span>{suggestion}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(event) => setCustomTag(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                handleAddCustomTag()
              }
            }}
            placeholder="Add custom suggestion tag (e.g. Frontend / React)..."
            className="flex-1 rounded-xl border border-input bg-white px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCustomTag}
            disabled={!customTag.trim()}
            className="h-auto py-1.5 px-3 text-xs gap-1"
          >
            <Plus size={12} />
            Add Tag
          </Button>
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
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" className="h-11 px-5" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserPlus size={17} />
          )}
          {isSubmitting ? "Creating..." : "Create Team"}
        </Button>
      </div>
    </form>
  )
}

"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Calendar, ChevronLeft, Info, Save, ShieldCheck } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import type { OrganizerCompetitionInput } from "../api/contracts"
import { useCreateOrganizerCompetition } from "../hooks/use-organizer-competitions"
import { toIsoDate, validateCompetitionInput } from "../lib/competition"

interface FormState {
  title: string
  category: string
  description: string
  requirements: string
  maxTeamSize: string
  registrationEndsAt: string
  startsAt: string
  submissionDeadline: string
  judgingEndsAt: string
  resultsAt: string
  guidebookCid: string
  certificateCid: string
}

const initialState: FormState = {
  title: "",
  category: "",
  description: "",
  requirements: "",
  maxTeamSize: "5",
  registrationEndsAt: "",
  startsAt: "",
  submissionDeadline: "",
  judgingEndsAt: "",
  resultsAt: "",
  guidebookCid: "",
  certificateCid: "",
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-xs font-semibold text-slate-600">
      {children}
    </label>
  )
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <FieldLabel>{label} *</FieldLabel>
      <div className="relative">
        <Calendar className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-blue-600" />
        <Input
          required
          type="datetime-local"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  )
}

export function OrganizerCompetitionForm() {
  const router = useRouter()
  const createCompetition = useCreateOrganizerCompetition()
  const [form, setForm] = useState<FormState>(initialState)
  const [validationError, setValidationError] = useState<string | null>(null)

  function setField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError(null)

    let input: OrganizerCompetitionInput
    try {
      input = {
        title: form.title.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        requirements: form.requirements.trim(),
        maxTeamSize: Number(form.maxTeamSize),
        registrationEndsAt: toIsoDate(form.registrationEndsAt),
        startsAt: toIsoDate(form.startsAt),
        submissionDeadline: toIsoDate(form.submissionDeadline),
        judgingEndsAt: toIsoDate(form.judgingEndsAt),
        resultsAt: toIsoDate(form.resultsAt),
        ...(form.guidebookCid.trim() && {
          guidebookCid: form.guidebookCid.trim(),
        }),
        ...(form.certificateCid.trim() && {
          certificateCid: form.certificateCid.trim(),
        }),
      }
    } catch {
      setValidationError("Complete every timeline field.")
      return
    }
    const error = validateCompetitionInput(input)
    if (error) {
      setValidationError(error)
      return
    }

    try {
      const competition = await createCompetition.mutateAsync(input)
      router.push(`/competition/${competition.id}`)
    } catch {
      // React Query exposes the normalized request error below the form header.
    }
  }

  const requestError =
    createCompetition.error instanceof Error
      ? createCompetition.error.message
      : null

  return (
    <div className="w-full bg-[#F8F9FF] py-10 text-slate-800">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mx-auto flex max-w-5xl flex-col px-5 md:px-10"
      >
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/organization")}
              className="mb-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <ChevronLeft className="size-4" /> Back to competitions
            </button>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Create Competition Draft
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Save the Web2 competition metadata first, then review and publish it.
            </p>
          </div>
          <Button
            type="submit"
            disabled={createCompetition.isPending}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Save className="size-4" />
            {createCompetition.isPending ? "Saving..." : "Save Draft"}
          </Button>
        </div>

        {(validationError || requestError) && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {validationError ?? requestError}
          </div>
        )}

        <section className="mb-6 rounded-xl bg-white p-6 md:p-8">
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-[#EFF4FF]/60 p-4">
            <Info className="mt-0.5 size-5 text-blue-600" />
            <div>
              <h2 className="font-bold text-slate-900">Basic information</h2>
              <p className="text-sm text-slate-500">
                These fields are visible to participants after publication.
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <FieldLabel>Competition name *</FieldLabel>
              <Input
                required
                minLength={3}
                maxLength={160}
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="Cobalt Buildathon 2026"
              />
            </div>
            <div>
              <FieldLabel>Category *</FieldLabel>
              <Input
                required
                maxLength={80}
                value={form.category}
                onChange={(event) => setField("category", event.target.value)}
                placeholder="Web3 & Infrastructure"
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Description *</FieldLabel>
              <textarea
                required
                maxLength={10_000}
                rows={5}
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the challenge and expected participant outcomes."
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Participant requirements *</FieldLabel>
              <textarea
                required
                maxLength={10_000}
                rows={5}
                value={form.requirements}
                onChange={(event) => setField("requirements", event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="List eligibility, deliverables, and competition rules."
              />
            </div>
            <div>
              <FieldLabel>Maximum team size *</FieldLabel>
              <Input
                required
                type="number"
                min={1}
                max={20}
                value={form.maxTeamSize}
                onChange={(event) => setField("maxTeamSize", event.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-xl bg-white p-6 md:p-8">
          <h2 className="font-bold text-slate-900">Competition timeline</h2>
          <p className="mt-1 mb-6 text-sm text-slate-500">
            Every milestone must be later than the previous milestone.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <DateField
              label="Registration ends"
              value={form.registrationEndsAt}
              onChange={(value) => setField("registrationEndsAt", value)}
            />
            <DateField
              label="Competition starts"
              value={form.startsAt}
              onChange={(value) => setField("startsAt", value)}
            />
            <DateField
              label="Submission deadline"
              value={form.submissionDeadline}
              onChange={(value) => setField("submissionDeadline", value)}
            />
            <DateField
              label="Judging ends"
              value={form.judgingEndsAt}
              onChange={(value) => setField("judgingEndsAt", value)}
            />
            <DateField
              label="Results announced"
              value={form.resultsAt}
              onChange={(value) => setField("resultsAt", value)}
            />
          </div>
        </section>

        <section className="mb-6 rounded-xl bg-white p-6 md:p-8">
          <h2 className="font-bold text-slate-900">Optional content references</h2>
          <p className="mt-1 mb-6 text-sm text-slate-500">
            File upload is not connected yet. Add an existing CID when available.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <FieldLabel>Guidebook CID</FieldLabel>
              <Input
                value={form.guidebookCid}
                onChange={(event) => setField("guidebookCid", event.target.value)}
                placeholder="ipfs://..."
              />
            </div>
            <div>
              <FieldLabel>Certificate CID</FieldLabel>
              <Input
                value={form.certificateCid}
                onChange={(event) => setField("certificateCid", event.target.value)}
                placeholder="ipfs://..."
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-dashed border-blue-200 bg-blue-50/60 p-6">
          <div className="flex gap-3">
            <ShieldCheck className="size-5 shrink-0 text-blue-600" />
            <div>
              <h2 className="font-bold text-slate-900">
                Prize escrow remains a preview
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Prize configuration, payment, and verified funding status will be
                connected after the Web3/indexer contract is finalized. Saving this
                draft does not move funds or claim that escrow is secured.
              </p>
            </div>
          </div>
        </section>
      </form>
    </div>
  )
}

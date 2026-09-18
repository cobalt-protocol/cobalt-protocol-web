"use client"
import {
  Badge,
  fieldClass,
  Panel,
  SectionHeading,
} from "@/components/ui/page-primitives"
import { useBrowserDraft } from "@/lib/browser-draft"
import { Button } from "@workspace/ui/components/button"
import { UploadCloud, X } from "lucide-react"
import { useRef, useState, type FormEvent } from "react"
import { emptySubmission } from "../data/workspace"
import {
  isSubmissionDraft,
  SUBMISSION_FILE_ACCEPT,
  validateSubmission,
  validateSubmissionFile,
} from "../lib/submission-validation"
import type { SubmissionDraft } from "../types"
function SubmissionEditor({
  initialDraft,
  onSave,
}: {
  initialDraft: SubmissionDraft
  onSave: (draft: SubmissionDraft) => boolean
}) {
  const [draft, setDraft] = useState(initialDraft)
  const [file, setFile] = useState<File | null>(null)
  const [feedback, setFeedback] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  function selectFile(next: File | undefined) {
    if (!next) return
    const error = validateSubmissionFile(next)
    if (error) {
      setFeedback(error)
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    setFile(next)
    setFeedback("")
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const error = validateSubmission(draft)
    if (error) {
      setFeedback(error)
      return
    }
    if (!draft.link.trim() && !file) {
      setFeedback("Attach a deliverable file or provide a submission link.")
      return
    }
    setFeedback(
      "Submission validated locally. Nothing has been uploaded or sent; final submission will be enabled after integration."
    )
  }
  return (
    <form onSubmit={submit}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <label className="block text-xs font-semibold">
            Submission Title <span className="text-red-500">*</span>
            <input
              required
              maxLength={160}
              className={fieldClass + " mt-2"}
              value={draft.title}
              placeholder="e.g. AI-Powered Supply Chain Optimization"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </label>
          <label className="block text-xs font-semibold">
            Project Description <span className="text-red-500">*</span>
            <textarea
              required
              maxLength={5000}
              className={fieldClass + " mt-2 min-h-28"}
              value={draft.description}
              placeholder="Tell us about your solution, key features, and what makes it unique..."
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>
          <label className="block text-xs font-semibold">
            Submission Link
            <input
              type="url"
              className={fieldClass + " mt-2"}
              value={draft.link}
              placeholder="https://..."
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  link: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold">Upload Files</p>
          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              selectFile(event.dataTransfer.files[0])
            }}
            className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 p-6 text-center focus-within:ring-2 focus-within:ring-primary"
          >
            <UploadCloud size={30} className="text-primary" />
            <span className="mt-4 text-xs font-semibold">
              Drag & drop a file here, or click to choose
            </span>
            <span className="mt-2 text-[10px] text-muted-foreground">
              PDF, ZIP, PPT, PPTX, DOC, DOCX · Max 50 MB
            </span>
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept={SUBMISSION_FILE_ACCEPT}
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
          </label>
          {file && (
            <div className="mt-3 flex min-w-0 items-center justify-between gap-2 rounded-lg bg-blue-50 p-3 text-xs">
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => {
                  setFile(null)
                  if (inputRef.current) inputRef.current.value = ""
                }}
              >
                <X size={15} />
              </button>
            </div>
          )}
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Selected files stay on your device and must be reattached after a
            refresh. Saving a draft stores text fields only.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          className="h-10"
          onClick={() =>
            setFeedback(
              onSave(draft)
                ? "Draft text saved in this browser."
                : "Could not save the draft. Browser storage is unavailable."
            )
          }
        >
          Save Draft
        </Button>
        <Button type="submit" className="h-10">
          Validate Deliverable
        </Button>
      </div>
      <p role="status" className="mt-4 text-sm text-muted-foreground">
        {feedback}
      </p>
    </form>
  )
}
export function SubmissionForm({ competitionId }: { competitionId: string }) {
  const { value, save, ready } = useBrowserDraft(
    `cobalt:submission:${competitionId}:v1`,
    emptySubmission,
    isSubmissionDraft
  )
  return (
    <Panel>
      <SectionHeading
        title="Project Submission"
        aside={<Badge>Local draft</Badge>}
      />
      {ready ? (
        <SubmissionEditor
          key={competitionId}
          initialDraft={value}
          onSave={save}
        />
      ) : (
        <p role="status">Loading saved draft…</p>
      )}
    </Panel>
  )
}

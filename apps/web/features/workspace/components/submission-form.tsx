"use client"
import {
  Badge,
  fieldClass,
  Panel,
  SectionHeading,
} from "@/components/ui/page-primitives"
import { useChainId } from "wagmi"
import { useBrowserDraft } from "@/lib/browser-draft"
import { Button } from "@workspace/ui/components/button"
import { CheckCircle2, ExternalLink, Pencil, UploadCloud, X } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { emptySubmission } from "../data/workspace"
import {
  isSubmissionDraft,
  SUBMISSION_FILE_ACCEPT,
  validateSubmission,
  validateSubmissionFile,
} from "../lib/submission-validation"
import type { SubmissionDraft } from "../types"
import { useSiteActions } from "@/components/layout/site-actions"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  DEFAULT_CHAIN_ID,
  fetchTeamSubmissionResult,
  fetchTeamDraftSubmissionResult,
  submitTeamProjectSubmissionApi,
  submitTeamDraftSubmissionApi,
  uploadToKuboIPFS,
  type ApiSubmissionProject,
} from "@/lib/competitions-api"

function SubmissionEditor({
  initialDraft,
  initialDocumentCid,
  onSave,
  teamId,
  chainId,
  onSuccess,
  onClear,
  onDraftSaved,
}: {
  initialDraft: SubmissionDraft
  initialDocumentCid?: string | null
  onSave: (draft: SubmissionDraft) => boolean
  teamId?: string
  chainId?: number
  onSuccess?: () => void
  onClear?: () => void
  onDraftSaved?: () => void
}) {
  const [draft, setDraft] = useState(initialDraft)
  const [file, setFile] = useState<File | null>(null)
  const [existingCid, setExistingCid] = useState<string | null>(initialDocumentCid || null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [feedback, setFeedback] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const ipfsGatewayBase = (
    process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "http://localhost:8081/ipfs"
  ).replace(/\/$/, "")
  const cleanCid = existingCid?.replace(/^ipfs:\/\//, "") || ""
  const kuboDraftUrl = cleanCid ? `${ipfsGatewayBase}/${cleanCid}` : ""

  useEffect(() => {
    setDraft(initialDraft)
  }, [initialDraft])

  useEffect(() => {
    setExistingCid(initialDocumentCid || null)
  }, [initialDocumentCid])
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
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!teamId) {
      setFeedback("Team ID is missing. Cannot submit project.")
      return
    }

    const error = validateSubmission(draft)
    if (error) {
      setFeedback(error)
      return
    }

    if (!draft.link.trim()) {
      setFeedback("Please enter a valid submission link.")
      return
    }

    if (!file && !existingCid) {
      setFeedback("Please select a deliverable file to upload.")
      return
    }

    setIsSubmitting(true)

    try {
      let cid = existingCid || ""
      if (file) {
        setFeedback("Uploading file to Kubo IPFS...")
        cid = await uploadToKuboIPFS(file)
        setFeedback(
          `File uploaded to IPFS (CID: ${cid}). Submitting project to API...`
        )
      } else {
        setFeedback("Submitting project deliverables to API...")
      }

      // 2. Submit to API endpoint POST /chains/:chainId/teams/:teamId/submission
      const result = await submitTeamProjectSubmissionApi(chainId ?? DEFAULT_CHAIN_ID, teamId as string, {
        title: draft.title.trim(),
        description: draft.description.trim(),
        submission_link: draft.link.trim(),
        document_cid: cid,
      })

      if (!result.success) {
        setFeedback(`Submission failed: ${result.error || "Unknown error"}`)
        setIsSubmitting(false)
        return
      }

      setFeedback(`Project submission successful! Document CID: ${cid}`)

      // Jika berhasil dengan status code 201, bersihkan state form, file, dan local draft
      if (result.status === 201 || result.success) {
        setDraft(emptySubmission)
        setFile(null)
        if (inputRef.current) inputRef.current.value = ""
        onSave(emptySubmission)
      }

      onSuccess?.()
    } catch (err: any) {
      setFeedback(
        `Submission error: ${err?.message || "Failed to process submission"}`
      )
    } finally {
      setIsSubmitting(false)
    }
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
              if (!isSubmitting) selectFile(event.dataTransfer.files[0])
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
              disabled={isSubmitting}
              className="sr-only"
              accept={SUBMISSION_FILE_ACCEPT}
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
          </label>
          {file ? (
            <div className="mt-3 flex min-w-0 items-center justify-between gap-2 rounded-lg bg-blue-50 p-3 text-xs">
              <span className="truncate font-medium text-slate-800">{file.name}</span>
              <button
                type="button"
                disabled={isSubmitting || isSavingDraft}
                aria-label="Remove attachment"
                onClick={() => {
                  setFile(null)
                  if (inputRef.current) inputRef.current.value = ""
                }}
              >
                <X size={15} />
              </button>
            </div>
          ) : existingCid ? (
            <div className="mt-3 flex min-w-0 items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/80 p-3 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-semibold text-blue-950 shrink-0">Draft File (Kubo IPFS):</span>
                <a
                  href={kuboDraftUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-blue-600 hover:underline truncate"
                  title={existingCid}
                >
                  <span className="truncate max-w-[180px] sm:max-w-xs">{cleanCid}</span>
                  <ExternalLink size={13} className="shrink-0" />
                </a>
              </div>
              <button
                type="button"
                disabled={isSubmitting || isSavingDraft}
                aria-label="Remove draft file"
                onClick={() => {
                  setExistingCid(null)
                }}
                className="text-slate-400 hover:text-slate-600 shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          ) : null}
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Selected files will be uploaded to IPFS upon submission.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-10 text-muted-foreground hover:text-red-600"
          disabled={isSubmitting}
          onClick={() => {
            setDraft(emptySubmission)
            setFile(null)
            setExistingCid(null)
            if (inputRef.current) inputRef.current.value = ""
            onSave(emptySubmission)
            onClear?.()
            setFeedback("Form cleared.")
          }}
        >
          Clear Form
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-10"
          disabled={isSubmitting || isSavingDraft}
          onClick={async () => {
            if (!teamId) {
              setFeedback("Team ID is missing. Cannot save draft.")
              return
            }

            if (!draft.title.trim()) {
              setFeedback("Please enter a title before saving draft.")
              return
            }

            setIsSavingDraft(true)
            setFeedback("Saving draft...")

            try {
              let documentCid = existingCid || ""

              // Jika ada file lokal baru, upload ke IPFS
              if (file) {
                setFeedback("Uploading file to IPFS...")
                try {
                  documentCid = await uploadToKuboIPFS(file)
                  setExistingCid(documentCid)
                } catch (ipfsErr: any) {
                  console.warn("IPFS upload skipped during draft save:", ipfsErr)
                }
              }

              const result = await submitTeamDraftSubmissionApi(
                chainId ?? DEFAULT_CHAIN_ID,
                teamId,
                {
                  title: draft.title.trim(),
                  description: draft.description.trim(),
                  submission_link: draft.link.trim(),
                  document_cid: documentCid,
                }
              )

              if (!result.success) {
                setFeedback(`Failed to save draft: ${result.error || "Unknown error"}`)
              } else {
                // Simpan juga ke browser storage sebagai backup
                onSave(draft)
                setFeedback("Draft saved successfully to server.")
                onDraftSaved?.()
              }
            } catch (err: any) {
              setFeedback(`Error saving draft: ${err?.message || "Unknown error"}`)
            } finally {
              setIsSavingDraft(false)
            }
          }}
        >
          {isSavingDraft ? "Saving..." : "Save Draft"}
        </Button>
        <Button type="submit" className="h-10" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Project"}
        </Button>
      </div>
      <p role="status" className="mt-4 text-sm text-muted-foreground">
        {feedback}
      </p>
    </form>
  )
}
function SubmissionDetailsView({
  submission,
  onEdit,
}: {
  submission: ApiSubmissionProject
  onEdit: () => void
}) {
  const rawCid = submission.document_cid?.replace(/^ipfs:\/\//, "") || ""
  const ipfsGatewayBase = (
    process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "http://localhost:8081/ipfs"
  ).replace(/\/$/, "")
  const kuboGatewayUrl = rawCid ? `${ipfsGatewayBase}/${rawCid}` : ""

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-emerald-900">
        <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-emerald-950">Project Submitted</p>
          <p className="text-xs text-emerald-700">
            Your team&apos;s project has been submitted successfully. You can update your submission anytime before the competition deadline.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Title</h4>
          <p className="mt-1 text-base font-medium text-slate-900">{submission.title}</p>
        </div>

        {submission.description && (
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</h4>
            <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{submission.description}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {submission.submission_link && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project / Repository Link</h4>
              <a
                href={submission.submission_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline break-all"
              >
                {submission.submission_link}
                <ExternalLink size={14} className="flex-shrink-0" />
              </a>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Submission Link</h4>
            <a
              href={kuboGatewayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline break-all"
            >
              {kuboGatewayUrl || rawCid}
              <ExternalLink size={14} className="flex-shrink-0" />
            </a>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Submitted: {new Date(submission.created_at).toLocaleString()}
          </span>
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
            <Pencil size={14} />
            Edit Submission
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SubmissionForm({
  competitionId,
  teamId,
}: {
  competitionId: string
  teamId?: string
}) {
  const [mounted, setMounted] = useState(false)
  const chainId = useChainId()
  const [isEditing, setIsEditing] = useState(false)
  const { connected } = useSiteActions()
  const queryClient = useQueryClient()
  const draftKey = `cobalt:submission:${competitionId}:${teamId || "default"}:v1`
  const legacyDraftKey = `cobalt:submission:${competitionId}:v1`

  const { value, save, ready } = useBrowserDraft(
    draftKey,
    emptySubmission,
    isSubmissionDraft
  )

  const handleClearDraft = () => {
    save(emptySubmission)
    try {
      window.localStorage.removeItem(draftKey)
      window.localStorage.removeItem(legacyDraftKey)
    } catch {}
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    data: submissionResult,
    isLoading: isLoadingSubmission,
  } = useQuery({
    queryKey: ["team-submission", chainId, teamId],
    queryFn: () => (teamId ? fetchTeamSubmissionResult(chainId, teamId) : null),
    enabled: Boolean(teamId),
  })

  const existingSubmission = submissionResult?.data

  const {
    data: draftSubmissionResult,
    isLoading: isLoadingDraftSubmission,
  } = useQuery({
    queryKey: ["team-draft-submission", chainId, teamId],
    queryFn: () => (teamId ? fetchTeamDraftSubmissionResult(chainId, teamId) : null),
    enabled: Boolean(teamId && !existingSubmission),
  })

  const existingDraft = draftSubmissionResult?.data

  // Jika submission sudah tercatat di database, bersihkan draft lokal yang tersisa
  useEffect(() => {
    if (existingSubmission) {
      try {
        window.localStorage.removeItem(draftKey)
        window.localStorage.removeItem(legacyDraftKey)
      } catch {}
    }
  }, [existingSubmission, draftKey, legacyDraftKey])

  if (!mounted || !connected) return null

  const initialDraft: SubmissionDraft = existingSubmission
    ? {
        title: existingSubmission.title,
        description: existingSubmission.description || "",
        link: existingSubmission.submission_link,
      }
    : existingDraft
      ? {
          title: existingDraft.title || "",
          description: existingDraft.description || "",
          link: existingDraft.submission_link || "",
        }
      : value

  return (
    <Panel>
      <SectionHeading
        title="Project Submission"
        aside={
          existingSubmission ? (
            <Badge tone="green">Submitted</Badge>
          ) : existingDraft ? (
            <Badge tone="blue">Draft saved</Badge>
          ) : (
            <Badge>Local draft</Badge>
          )
        }
      />
      {isLoadingSubmission || isLoadingDraftSubmission ? (
        <p role="status" className="text-sm text-slate-500">
          Checking submission status...
        </p>
      ) : existingSubmission && !isEditing ? (
        <SubmissionDetailsView
          submission={existingSubmission}
          onEdit={() => setIsEditing(true)}
        />
      ) : ready ? (
        <div>
          {isEditing && existingSubmission && (
            <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
              <span>Editing existing submission. Submitting will update your project deliverables.</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="h-7 text-xs text-blue-800 hover:bg-blue-100"
              >
                Cancel Edit
              </Button>
            </div>
          )}
          <SubmissionEditor
            key={`${competitionId}-${teamId || "default"}-${existingSubmission?.id || existingDraft?.id || "new"}`}
            initialDraft={initialDraft}
            initialDocumentCid={existingSubmission?.document_cid || existingDraft?.document_cid || null}
            onSave={save}
            onClear={handleClearDraft}
            onDraftSaved={() => {
              queryClient.invalidateQueries({
                queryKey: ["team-draft-submission", chainId, teamId],
              })
            }}
            teamId={teamId}
            chainId={chainId}
            onSuccess={() => {
              handleClearDraft()
              queryClient.invalidateQueries({
                queryKey: ["team-submission", chainId, teamId],
              })
              queryClient.invalidateQueries({
                queryKey: ["team-draft-submission", chainId, teamId],
              })
              setIsEditing(false)
            }}
          />
        </div>
      ) : (
        <p role="status">Loading saved draft…</p>
      )}
    </Panel>
  )
}

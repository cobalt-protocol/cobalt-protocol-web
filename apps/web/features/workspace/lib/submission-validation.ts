import type { SubmissionDraft } from "../types"
export const MAX_SUBMISSION_FILE_BYTES = 50 * 1024 * 1024
export const SUBMISSION_FILE_ACCEPT = ".pdf,.zip,.ppt,.pptx,.doc,.docx"
export function isSubmissionDraft(value: unknown): value is SubmissionDraft {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    typeof value.title === "string" &&
    "description" in value &&
    typeof value.description === "string" &&
    "link" in value &&
    typeof value.link === "string"
  )
}
export function validateSubmission(draft: SubmissionDraft): string | null {
  if (!draft.title.trim() || !draft.description.trim())
    return "Add a submission title and project description."
  if (draft.title.length > 160 || draft.description.length > 5000)
    return "Keep the title under 160 characters and description under 5,000 characters."
  if (draft.link.trim()) {
    try {
      const url = new URL(draft.link)
      if (!["http:", "https:"].includes(url.protocol))
        return "Use an HTTP or HTTPS submission link."
    } catch {
      return "Enter a valid submission URL."
    }
  }
  return null
}
export function validateSubmissionFile(file: {
  name: string
  size: number
}): string | null {
  if (!/\.(pdf|zip|pptx?|docx?)$/i.test(file.name))
    return "Choose a PDF, ZIP, PowerPoint, or Word file."
  if (file.size > MAX_SUBMISSION_FILE_BYTES)
    return "The file must be 50 MB or smaller."
  if (file.size === 0) return "The selected file is empty."
  return null
}

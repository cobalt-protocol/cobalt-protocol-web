"use client"
import { useSiteActions } from "@/components/layout/site-actions"
import { Button } from "@workspace/ui/components/button"
import { Share2 } from "lucide-react"
import type { RegistrationCompetition } from "@/features/registration/types"

export function CompetitionActions({
  competition,
}: {
  competition: RegistrationCompetition
}) {
  const { register, showNotice } = useSiteActions()
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showNotice("Competition link copied.")
    } catch {
      showNotice(
        "Could not copy the link. You can copy the URL from your browser’s address bar."
      )
    }
  }
  return (
    <div className="mt-6 flex gap-3">
      <Button onClick={() => register(competition)} className="h-11 px-5">
        Register for Free →
      </Button>
      <Button
        variant="secondary"
        aria-label="Copy competition link"
        className="h-11 w-11"
        onClick={share}
      >
        <Share2 size={17} />
      </Button>
    </div>
  )
}

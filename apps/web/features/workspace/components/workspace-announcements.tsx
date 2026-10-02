"use client"
import { useEffect, useState } from "react"
import { FileBadge, LockKeyhole } from "lucide-react"
import { Badge, Panel, SectionHeading } from "@/components/ui/page-primitives"
import { useSiteActions } from "@/components/layout/site-actions"

export function WorkspaceAnnouncements() {
  const [mounted, setMounted] = useState(false)
  const { connected } = useSiteActions()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !connected) return null

  return (
    <Panel>
      <SectionHeading
        title="Announcements & Credentials"
        description="Competition notifications, jury updates, and credential certificates."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-border/60 bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <FileBadge size={23} className="text-slate-400" />
            <h3 className="text-sm font-bold">Participant Certificate</h3>
            <span className="ml-auto">
              <Badge tone="neutral">
                <LockKeyhole size={10} />
                Locked
              </Badge>
            </span>
          </div>
          <button
            disabled
            className="mt-5 rounded-lg bg-slate-200/70 px-3 py-3 text-xs text-slate-500"
          >
            Mint Participant Certificate NFT
          </button>
          <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
            Available after judging and results are finalized.
          </p>
        </div>
        <div className="flex flex-col rounded-xl border border-border/60 bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <FileBadge size={23} className="text-slate-400" />
            <h3 className="text-sm font-bold">Winner Certificate</h3>
            <span className="ml-auto">
              <Badge tone="neutral">
                <LockKeyhole size={10} />
                Locked
              </Badge>
            </span>
          </div>
          <button
            disabled
            className="mt-5 rounded-lg bg-slate-200/70 px-3 py-3 text-xs text-slate-500"
          >
            Mint Winner Certificate NFT
          </button>
          <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
            Available after final judging and prize settlement.
          </p>
        </div>
      </div>
    </Panel>
  )
}


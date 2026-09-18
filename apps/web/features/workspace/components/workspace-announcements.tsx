import { FileBadge, LockKeyhole } from "lucide-react"
import { Badge, Panel, SectionHeading } from "@/components/ui/page-primitives"
export function WorkspaceAnnouncements() {
  return (
    <Panel>
      <SectionHeading
        title="Announcements & Credentials"
        description="Competition notifications, jury updates, and credential certificates."
      />
      <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3">
          <article className="rounded-xl border border-border/60 bg-slate-50 p-4">
            <Badge>Update</Badge>
            <h3 className="mt-2 text-sm font-bold">Registration is open</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Review the competition timeline and prepare your team before the
              registration deadline.
            </p>
          </article>
          <article className="rounded-xl border border-border/60 bg-slate-50 p-4">
            <h3 className="text-sm font-bold">
              Credentials & Participation Certificates
            </h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Certificates become available after judging and results are
              finalized.
            </p>
          </article>
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-border/60 bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <FileBadge size={23} className="text-slate-400" />
            <h3 className="text-sm font-bold">Certificate</h3>
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
            Download Participation / Winner Certificate
          </button>
          <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
            Available after final judging and prize settlement.
          </p>
        </div>
      </div>
    </Panel>
  )
}

import { Badge, Panel, SectionHeading } from "@/components/ui/page-primitives"
import type { TimelineStage } from "../types"

export function CompetitionTimeline({
  stages,
}: {
  stages: readonly TimelineStage[]
}) {
  return (
    <Panel>
      <p className="mb-2 text-[10px] font-bold text-primary uppercase">
        Lifecycle architecture
      </p>
      <SectionHeading
        title="Competition Timeline & Key Deadlines"
        aside={<Badge>● All timestamps normalized to UTC timezone</Badge>}
      />
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stages.map((stage, index) => (
          <li
            key={stage.id}
            className="flex flex-col rounded-xl bg-secondary/60 p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <span
                className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${stage.status === "active" ? "bg-primary text-white" : "bg-blue-100 text-foreground"}`}
              >
                {index + 1}
              </span>
              <Badge tone={stage.status === "active" ? "blue" : "neutral"}>
                {stage.status === "active"
                  ? "ACTIVE NOW"
                  : stage.status.toUpperCase()}
              </Badge>
            </div>
            <h3 className="text-sm font-bold">{stage.title}</h3>
            <p className="mt-2 mb-7 text-xs leading-5 text-muted-foreground">
              {stage.description}
            </p>
            <p className="mt-auto text-xs font-semibold">{stage.dateLabel}</p>
          </li>
        ))}
      </ol>
    </Panel>
  )
}

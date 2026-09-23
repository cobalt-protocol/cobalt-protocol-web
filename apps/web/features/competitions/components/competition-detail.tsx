import {
  Badge,
  Breadcrumbs,
  PageContainer,
  Panel,
  SectionHeading,
} from "@/components/ui/page-primitives"
import { formatDate, formatMoney } from "@/lib/format"
import { routes } from "@/lib/routes"
import {
  Award,
  CalendarDays,
  CircleCheck,
  Code2,
  Coins,
  Users,
  Wifi,
} from "lucide-react"
import type { Competition } from "../types"
import { CompetitionOverview } from "./competition-overview"
import { CompetitionTimeline } from "./competition-timeline"

export function CompetitionDetail({
  competition,
}: {
  competition: Competition
}) {
  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Home", href: routes.home },
          { label: "Competitions", href: routes.competitions },
          { label: "Detail Competition" },
        ]}
      />
      <div className="space-y-5">
        <CompetitionOverview competition={competition} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: "Registration End",
              value: formatDate(competition.registrationEndsAt),
              caption: "Registration window",
              icon: CalendarDays,
            },
            {
              label: "Duration",
              value: `${formatDate(competition.startsAt)} – ${formatDate(competition.endsAt)}`,
              caption: "Competition period",
              icon: Code2,
            },
            {
              label: "Team Size",
              value: `1–${competition.maxTeamSize} Builders`,
              caption: "Solo or squads",
              icon: Users,
            },
            {
              label: "Competition Format",
              value: "100% Online",
              caption: "Asynchronous submissions",
              icon: Wifi,
            },
            {
              label: "Prize Currency",
              value: `${competition.currency} Stablecoin`,
              caption: "Arbitrum escrow",
              icon: Coins,
            },
          ].map(({ label, value, caption, icon: Icon }) => (
            <Panel key={label} className="p-4 md:p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon size={15} className="text-primary" />
                {label}
              </p>
              <h2 className="mt-2 text-sm font-bold">{value}</h2>
              <p className="mt-4 text-[11px] text-muted-foreground">
                {caption}
              </p>
            </Panel>
          ))}
        </div>
        <CompetitionTimeline stages={competition.timeline} />
        <Panel>
          <SectionHeading title="Judging Rubric & Weighting" />
          <div className="grid gap-4 sm:grid-cols-3">
            {competition.judgingCriteria.map((criterion) => (
              <article
                key={criterion.id}
                className="rounded-xl bg-secondary/60 p-5"
              >
                <p className="text-xl font-extrabold text-primary">
                  {criterion.weight}%
                </p>
                <h3 className="mt-2 text-sm font-bold">{criterion.title}</h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {criterion.description}
                </p>
              </article>
            ))}
            {competition.judgingCriteria.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground">
                Judging criteria have not been published yet.
              </p>
            )}
          </div>
        </Panel>
        <div className="grid items-start gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <div className="space-y-5">
            <Panel>
              <p className="text-[10px] font-bold text-primary uppercase">
                Organizer verification
              </p>
              <h2 className="mt-5 text-base font-bold">
                {competition.organizer}
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {competition.organizerDescription}
              </p>
            </Panel>
            <Panel>
              <SectionHeading title="Eligibility & Competition Rules" />
              <ul className="space-y-4">
                {competition.rules.map((rule) => (
                  <li key={rule} className="flex gap-2 text-xs leading-6">
                    <CircleCheck
                      size={16}
                      className="mt-1 shrink-0 text-teal-700"
                    />
                    {rule}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
          <Panel>
            <p className="mb-2 text-[10px] font-bold text-primary uppercase">
              {competition.prizes.length > 0
                ? "Secured payout pool"
                : "Prize information"}
            </p>
            <SectionHeading title="Prize Distribution" />
            <div className="space-y-3">
              {competition.prizes.map((prize, index) => (
                <div
                  key={prize.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl bg-secondary/60 p-5"
                >
                  <span className="rounded-lg bg-blue-100 p-2 text-amber-600">
                    <Award size={23} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold">
                      {prize.title} {index === 0 && <Badge>Grand Prize</Badge>}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {prize.description}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <strong className="text-xl">
                      {formatMoney(prize.amount)}
                    </strong>
                    <p className="text-[10px] font-bold text-teal-700">
                      {competition.currency} Escrow
                    </p>
                  </div>
                </div>
              ))}
              {competition.prizes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Prize categories and verified funding status are not available yet.
                </p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </PageContainer>
  )
}

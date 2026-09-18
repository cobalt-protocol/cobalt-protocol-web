import {
  ArrowRight,
  Bot,
  KeyRound,
  Shield,
  UserPlus,
  Users,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import type { RegistrationCompetition } from "../types"
export function ParticipationChoice({
  competition,
  username,
  onCreate,
  onJoin,
}: {
  competition: RegistrationCompetition
  username: string
  onCreate: () => void
  onJoin: () => void
}) {
  return (
    <>
      <p className="mt-3 text-sm text-muted-foreground">
        Choose your participation path for{" "}
        <strong className="text-foreground">{competition.title}</strong>.
      </p>
      <p className="mt-3 text-xs text-teal-700">Joining as @{username}</p>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        {[
          {
            title: "Create a Team",
            description:
              "Create your own team, become the team lead, and invite or recruit members tailored to you.",
            icon: Users,
            label: "LEAD ROLE",
            benefits: [
              "Recruit with AI matchmaking",
              "Set private or public roster",
            ],
            secondaryIcon: Shield,
            onClick: onCreate,
          },
          {
            title: "Join a Team",
            description:
              "Find an existing squad looking for your skills, or join using a private team invite code.",
            icon: UserPlus,
            label: "FIND YOUR SQUAD",
            benefits: [
              "Explore recommended squads",
              "Enter private team invite code",
            ],
            secondaryIcon: KeyRound,
            onClick: onJoin,
          },
        ].map(
          ({
            title,
            description,
            icon: Icon,
            label,
            benefits,
            secondaryIcon: SecondaryIcon,
            onClick,
          }) => (
            <section
              key={title}
              className="flex flex-col rounded-2xl border border-border/50 p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-xl bg-indigo-100 p-3 text-primary">
                  <Icon size={25} />
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {label}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
              <div className="my-5 space-y-2 rounded-lg bg-secondary/60 p-3 text-xs">
                <p className="flex items-center gap-2">
                  <Bot size={15} className="text-teal-700" />
                  {benefits[0]}
                </p>
                <p className="flex items-center gap-2">
                  <SecondaryIcon size={15} className="text-primary" />
                  {benefits[1]}
                </p>
              </div>
              <Button className="mt-auto h-11 w-full" onClick={onClick}>
                {title}
                <ArrowRight size={16} />
              </Button>
            </section>
          )
        )}
      </div>
    </>
  )
}

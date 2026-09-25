import type { BuilderProfile } from "@/features/profile/types"
import { Modal } from "@/components/ui/modal"
import { routes } from "@/lib/routes"
import type { CreateTeamInput, RegistrationDialog } from "../types"
import { CreateTeamForm } from "./create-team-form"
import { ParticipationChoice } from "./participation-choice"
import { ProfilePrompt } from "./profile-prompt"
interface RegistrationDialogsProps {
  dialog: RegistrationDialog
  profile: BuilderProfile
  onChange: (dialog: RegistrationDialog) => void
  onNavigate: (href: string) => void
  onCreate: (input: CreateTeamInput) => Promise<string | null> | string | null
}
export function RegistrationDialogs({
  dialog,
  profile,
  onChange,
  onNavigate,
  onCreate,
}: RegistrationDialogsProps) {
  if (!dialog || dialog.kind === "wallet") return null
  const title =
    dialog.kind === "profile"
      ? "Set Up Your Profile"
      : dialog.kind === "choice"
        ? "How do you want to join?"
        : "Create a Team"
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onChange(null)
      }}
      title={title}
      className={
        dialog.kind === "choice"
          ? "max-w-3xl"
          : dialog.kind === "create"
            ? "max-w-2xl"
            : undefined
      }
    >
      {dialog.kind === "profile" ? (
        <ProfilePrompt
          onLater={() => onChange(null)}
          onSetup={() =>
            onNavigate(
              dialog.competition
                ? `${routes.profile}?setup=1&competition=${encodeURIComponent(dialog.competition.slug)}`
                : `${routes.profile}?setup=1`
            )
          }
        />
      ) : dialog.kind === "choice" ? (
        <ParticipationChoice
          competition={dialog.competition}
          username={profile.username}
          onCreate={() =>
            onChange({ kind: "create", competition: dialog.competition })
          }
          onJoin={() => onNavigate(routes.joinTeam(dialog.competition.slug))}
        />
      ) : (
        <CreateTeamForm
          competition={dialog.competition}
          profile={profile}
          onCancel={() =>
            onChange({ kind: "choice", competition: dialog.competition })
          }
          onCreate={onCreate}
        />
      )}
    </Modal>
  )
}

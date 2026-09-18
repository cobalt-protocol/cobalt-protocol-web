import { ArrowRight, Check, ContactRound, UserRound } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
export function ProfilePrompt({
  onSetup,
  onLater,
}: {
  onSetup: () => void
  onLater: () => void
}) {
  return (
    <div className="text-center">
      <div className="mx-auto my-6 flex size-20 -rotate-6 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-200">
        <ContactRound size={45} />
      </div>
      <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
        Before you can join competitions, please complete your profile. This
        helps other teams learn more about you.
      </p>
      <div className="my-6 space-y-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-5 text-left">
        {[
          {
            title: "Add your personal details",
            text: "Email, name, skills, and what you can offer.",
            icon: UserRound,
          },
          {
            title: "Start joining competitions",
            text: "Once your profile is set up, you can join competitions.",
            icon: Check,
          },
        ].map(({ title, text, icon: Icon }) => (
          <div key={title} className="flex items-center gap-3">
            <span className="rounded-full bg-blue-100 p-2 text-primary">
              <Icon size={19} />
            </span>
            <div>
              <h3 className="text-xs font-bold">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <Button className="h-11 w-full" onClick={onSetup}>
        Go to Profile Setup <ArrowRight size={16} />
      </Button>
      <button
        className="mt-4 p-2 text-xs text-muted-foreground"
        onClick={onLater}
      >
        Maybe Later
      </button>
    </div>
  )
}

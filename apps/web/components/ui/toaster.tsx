"use client"

import { X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@workspace/ui/lib/utils"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-end gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:p-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          data-state={t.open ? "open" : "closed"}
          className={cn(
            "pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border bg-white p-4 pr-8 shadow-lg transition-all",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-right-full",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-2",
            t.variant === "destructive"
              ? "border-destructive/50 bg-destructive text-destructive-foreground dark:bg-destructive dark:text-destructive-foreground"
              : "border-border bg-white text-foreground"
          )}
        >
          <div className="flex-1 space-y-1">
            {t.title ? (
              <div
                className={cn(
                  "text-sm font-semibold leading-none tracking-tight",
                  t.variant === "destructive" ? "text-white" : "text-foreground"
                )}
              >
                {t.title}
              </div>
            ) : null}
            {t.description ? (
              <div
                className={cn(
                  "text-sm leading-snug opacity-90",
                  t.variant === "destructive" ? "text-white/90" : "text-muted-foreground"
                )}
              >
                {t.description}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close toast"
            onClick={() => dismiss(t.id)}
            className={cn(
              "absolute right-2 top-2 rounded-md p-1 transition",
              t.variant === "destructive"
                ? "text-white/80 hover:bg-white/15 hover:text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

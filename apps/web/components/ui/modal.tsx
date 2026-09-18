"use client"
import { useEffect, useId, useRef, type ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  className?: string
}
export function Modal({
  open,
  onOpenChange,
  title,
  children,
  className,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog?.open) dialog?.showModal()
    if (!open && dialog?.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={() => onOpenChange(false)}
      onClose={() => {
        if (open) onOpenChange(false)
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false)
      }}
      className={cn(
        "m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl border border-border bg-white p-0 text-foreground shadow-2xl backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm",
        className
      )}
    >
      <div className="relative p-6 sm:p-8">
        <button
          type="button"
          aria-label="Close dialog"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 rounded p-2 text-slate-400 hover:bg-slate-50"
        >
          <X size={19} />
        </button>
        <h2
          id={titleId}
          className="pr-9 text-2xl font-extrabold tracking-tight"
        >
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  )
}

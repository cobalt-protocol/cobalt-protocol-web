import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "@workspace/ui/lib/utils"

export const primaryLinkClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-10 md:py-10">
      {children}
    </div>
  )
}
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/50 bg-white p-5 shadow-sm md:p-7",
        className
      )}
      {...props}
    />
  )
}
export function SectionHeading({
  title,
  description,
  aside,
}: {
  title: string
  description?: string
  aside?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {aside}
    </div>
  )
}
export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode
  tone?: "blue" | "green" | "neutral"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold",
        tone === "green"
          ? "bg-teal-50 text-teal-700"
          : tone === "neutral"
            ? "bg-slate-100 text-slate-500"
            : "bg-blue-50 text-blue-700"
      )}
    >
      {children}
    </span>
  )
}
export interface BreadcrumbItem {
  label: string
  href?: string
}
export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1">
            {index > 0 && <ChevronRight size={12} aria-hidden="true" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className="font-semibold text-foreground"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
export const fieldClass =
  "w-full rounded-lg border border-border bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-65"

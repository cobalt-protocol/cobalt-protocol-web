"use client"
import { Anchor, UserRound } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { routes } from "@/lib/routes"
import { useSiteActions } from "./site-actions"
export function Brand() {
  return (
    <Link
      href={routes.home}
      aria-label="Cobalt Protocol home"
      className="inline-flex items-center gap-2 font-heading text-lg font-extrabold tracking-tight"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
        <Anchor size={24} />
      </span>
      <span>
        Cobalt<span className="text-primary">Protocol</span>
      </span>
    </Link>
  )
}
export function SiteHeader() {
  const { openWallet } = useSiteActions()
  const pathname = usePathname()
  return (
    <header className="border-b border-border/30 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-10">
        <Brand />
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-3 sm:gap-5"
        >
          <Link
            href={routes.competitions}
            aria-current={
              pathname.startsWith(routes.competitions) ? "page" : undefined
            }
            className="text-xs font-semibold hover:text-primary aria-[current=page]:text-primary sm:text-sm"
          >
            Competitions
          </Link>
          <Button className="h-9 px-3 text-xs sm:text-sm" onClick={openWallet}>
            Connect Wallet
          </Button>
          <Link
            href={routes.profile}
            aria-label="Your profile"
            className="rounded-full bg-blue-50 p-2 text-primary"
          >
            <UserRound size={18} />
          </Link>
        </nav>
      </div>
    </header>
  )
}

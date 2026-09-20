"use client"
import Link from "next/link"
import { routes } from "@/lib/routes"
import { Brand } from "./site-header"
import { useSiteActions } from "./site-actions"
export function SiteFooter() {
  const { openWallet, connected, showNotice } = useSiteActions()
  const linkClass =
    "block text-left text-xs leading-6 text-muted-foreground hover:text-primary"
  return (
    <footer className="bg-[#E5EEFF]">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(4,1fr)]">
          <div>
            <Brand />
            <p className="mt-4 max-w-sm text-xs leading-6 text-muted-foreground">
              The institutional-grade competition and hackathon platform
              engineered for decentralized developer ecosystems, on-chain
              verification, and cryptographic trust.
            </p>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-bold">Competitions</h2>
            <Link href={routes.competitions} className={linkClass}>
              Discover Competition
            </Link>
            <Link href={routes.profile} className={linkClass}>
              Builder Profile
            </Link>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-bold">For Organizers</h2>
            <Link href={routes.organization} className={linkClass}>
              Host Competition
            </Link>
            {!connected ? (
              <button className={linkClass} onClick={openWallet}>
                Connect Wallet
              </button>
            ) : null}
          </div>
          <div>
            <h2 className="mb-3 text-sm font-bold">Platform</h2>
            <Link className={linkClass} href="/#how-it-works">
              How It Works
            </Link>
            <Link className={linkClass} href="/#escrow">
              About Us
            </Link>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-bold">Governance</h2>
            {["Terms", "Privacy"].map((label) => (
              <button
                key={label}
                className={linkClass}
                onClick={() =>
                  showNotice(
                    `${label} will be published before the platform launches.`
                  )
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-wrap justify-between gap-5 text-xs text-muted-foreground">
          <p>© 2026 Cobalt Protocol Foundation. All rights reserved.</p>
          <div className="flex flex-wrap gap-6">
            {["Developer Community", "Privacy Policy", "Terms of Service"].map(
              (label) => (
                <button
                  key={label}
                  onClick={() =>
                    showNotice(`${label} will be available before launch.`)
                  }
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}

"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@workspace/ui/components/button"
import { routes } from "@/lib/routes"
import { useSiteActions } from "./site-actions"
import { AccountMenu } from "./account-menu"
export function Brand() {
  return (
    <Link
      href={routes.home}
      aria-label="Cobalt Protocol home"
      className="inline-flex items-center gap-2 font-heading text-lg font-extrabold tracking-tight"
    >
      <Image
        src="/icon.webp"
        alt="Cobalt Protocol logo"
        width={200}
        height={50}
        style={{ height: "auto", width: "auto" }}
        className="w-[200px] object-contain"
      />
    </Link>
  )
}
export function SiteHeader() {
  const {
    openWallet,
    connected,
    isWrongNetwork,
    switchNetwork,
  } = useSiteActions()

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-10">
        <Brand />
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-3 sm:gap-5"
        >
          {isWrongNetwork ? (
            <Button
              variant="destructive"
              className="h-9 px-3 text-xs sm:text-sm"
              onClick={switchNetwork}
            >
              Switch to BotChain Testnet
            </Button>
          ) : connected ? (
            <AccountMenu />
          ) : (
            <Button
              variant="default"
              className="h-9 px-3 text-xs sm:text-sm"
              onClick={openWallet}
            >
              Connect Wallet
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}

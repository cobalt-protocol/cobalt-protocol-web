"use client"
import { UserRound } from "lucide-react"
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
        className="h-auto w-[200px] object-contain"
      />
    </Link>
  )
}
export function SiteHeader() {
  const {
    openWallet,
    connected,
    address,
    isWrongNetwork,
    switchNetwork,
    disconnectWallet,
  } = useSiteActions()

  const formattedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null

  return (
    <header className="border-b border-border/30 bg-white">
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
          ) : (
            <Button
              className="h-9 px-3 text-xs sm:text-sm"
              onClick={connected ? disconnectWallet : openWallet}
            >
              {connected ? "Disconnect Wallet" : "Connect Wallet"}
            </Button>
          )}
          {connected ? (
            <AccountMenu />
          ) : (
            <Link
              href={routes.profile}
              aria-label="Your profile"
              className="rounded-full bg-blue-50 p-2 text-primary"
            >
              <UserRound size={18} />
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

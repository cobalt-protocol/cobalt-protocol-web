"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ContactRound,
  LayoutDashboard,
  LogOut,
  SlidersHorizontal,
  UserRound,
} from "lucide-react"
import { DropdownMenu } from "@workspace/ui/components/dropdown-menu"
import { routes } from "@/lib/routes"
import { fetchApiMe, getStoredToken } from "@/lib/competitions-api"
import { useSiteActions } from "./site-actions"

export function AccountMenu() {
  const pathname = usePathname()
  const { disconnectWallet, showNotice } = useSiteActions()
  const [storedToken, setStoredToken] = useState<string | null>(null)

  useEffect(() => {
    setStoredToken(getStoredToken())
  }, [])

  const { data: meUser } = useQuery({
    queryKey: ["user-me", storedToken],
    queryFn: () => fetchApiMe(storedToken || getStoredToken()),
    enabled: Boolean(storedToken),
  })

  const isOrganization =
    meUser?.role === "organization" || meUser?.role === "organizer"
  const dashboardHref = isOrganization ? routes.organization : routes.dashboard

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Account menu"
        className="rounded-full bg-primary p-2 text-white cursor-pointer"
      >
        <UserRound size={18} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner align="end" sideOffset={10} className="z-50">
          <DropdownMenu.Popup className="w-80 max-w-[calc(100vw_-_2rem)] rounded-xl border border-border bg-white p-2 shadow-xl outline-none">
            {[
              {
                href: routes.profile,
                title: "Profile",
                description: "View & edit your builder credentials",
                icon: ContactRound,
              },
              {
                href: dashboardHref,
                title: "Dashboard",
                description: isOrganization
                  ? "Manage competitions & created events"
                  : "Track active competitions & submissions",
                icon: LayoutDashboard,
              },
            ].map(({ href, title, description, icon: Icon }) => {
              const isActive =
                pathname === href ||
                (href === routes.organization &&
                  pathname.startsWith("/organization/competition"))
              return (
                <DropdownMenu.LinkItem
                  key={href}
                  closeOnClick
                  render={<Link href={href} />}
                  className={`flex items-center gap-3 rounded-lg p-3 outline-none cursor-pointer data-highlighted:bg-blue-50 ${isActive ? "bg-blue-50 text-primary" : ""}`}
                >
                  <span
                    className={`rounded-lg p-2 ${isActive ? "bg-primary text-white" : "bg-blue-50"}`}
                  >
                    <Icon size={17} />
                  </span>
                  <span>
                    <strong className="block text-sm font-semibold">
                      {title}
                    </strong>
                    <span className="text-xs text-muted-foreground">
                      {description}
                    </span>
                  </span>
                </DropdownMenu.LinkItem>
              )
            })}
            <DropdownMenu.Separator className="my-2 h-px bg-border" />
            <DropdownMenu.Item
              onClick={() =>
                showNotice(
                  "Wallet preview is connected. Real escrow balances and key settings will be available after wallet integration. Never enter a recovery phrase here."
                )
              }
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs outline-none cursor-pointer data-highlighted:bg-blue-50"
            >
              <SlidersHorizontal size={16} />
              Escrow & Key Settings
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={disconnectWallet}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-red-600 outline-none cursor-pointer data-highlighted:bg-red-50"
            >
              <LogOut size={16} />
              Disconnect Multi-sig
            </DropdownMenu.Item>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}


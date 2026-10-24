"use client"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
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
  const router = useRouter()
  const { disconnectWallet, showNotice } = useSiteActions()
  const [storedToken, setStoredToken] = useState<string | null>(null)
  const [activePath, setActivePath] = useState<string>(() =>
    typeof window !== "undefined" ? window.location.pathname : pathname || ""
  )

  useEffect(() => {
    setStoredToken(getStoredToken())
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActivePath(window.location.pathname)
    } else if (pathname) {
      setActivePath(pathname)
    }
  }, [pathname])

  const { data: meUser } = useQuery({
    queryKey: ["user-me", storedToken],
    queryFn: () => fetchApiMe(storedToken || getStoredToken()),
    enabled: Boolean(storedToken),
  })

  const currentPath =
    activePath || (typeof window !== "undefined" ? window.location.pathname : pathname || "")
  const isOrganizationPath = currentPath.startsWith("/organization")
  const isOrganizationRole =
    meUser?.role === "organization" || meUser?.role === "organizer"
  const dashboardHref = isOrganizationRole ? routes.organization : routes.dashboard
  const profileHref = isOrganizationPath ? routes.organizationProfile : routes.profile

  return (
    <DropdownMenu.Root
      onOpenChange={(open) => {
        if (open && typeof window !== "undefined") {
          setActivePath(window.location.pathname)
          setStoredToken(getStoredToken())
        }
      }}
    >
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
                kind: "profile" as const,
                href: profileHref,
                title: "Profile",
                description: isOrganizationPath
                  ? "View & edit your organization profile"
                  : "View & edit your builder credentials",
                icon: ContactRound,
              },
              {
                kind: "dashboard" as const,
                href: dashboardHref,
                title: "Dashboard",
                description: isOrganizationRole
                  ? "Manage competitions & created events"
                  : "Track active competitions & submissions",
                icon: LayoutDashboard,
              },
            ].map(({ kind, href, title, description, icon: Icon }) => {
              const isActive =
                currentPath === href ||
                (href === routes.organization &&
                  currentPath.startsWith("/organization/competition"))
              return (
                <DropdownMenu.Item
                  key={kind}
                  onClick={async () => {
                    if (kind === "profile") {
                      const livePath =
                        typeof window !== "undefined"
                          ? window.location.pathname
                          : currentPath
                      const isOrgNow = livePath.startsWith("/organization")
                      router.push(
                        isOrgNow ? routes.organizationProfile : routes.profile
                      )
                      return
                    }

                    // Untuk Dashboard: cek role user menggunakan API me
                    let role = meUser?.role
                    const token = getStoredToken() || storedToken
                    if (token) {
                      const freshMe = await fetchApiMe(token)
                      if (freshMe?.role) {
                        role = freshMe.role
                      }
                    }
                    const isOrgRole =
                      role === "organization" || role === "organizer"
                    router.push(isOrgRole ? routes.organization : routes.dashboard)
                  }}
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
                </DropdownMenu.Item>
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


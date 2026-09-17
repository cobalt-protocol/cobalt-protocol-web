import { Manrope, Plus_Jakarta_Sans } from "next/font/google"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteActionsProvider } from "@/components/layout/site-actions"
import { cn } from "@workspace/ui/lib/utils"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        "font-sans",
        manrope.variable,
        plusJakartaSans.variable
      )}
    >
      <body>
        <ThemeProvider forcedTheme="light" enableSystem={false}>
          <SiteActionsProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:p-3"
            >
              Skip to content
            </a>
            <SiteHeader />
            <main id="main" className="min-h-[65vh]">
              {children}
            </main>
            <SiteFooter />
          </SiteActionsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

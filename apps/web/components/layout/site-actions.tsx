"use client"
import { createContext, useContext, useState, type ReactNode } from "react"
import {
  ChevronRight,
  Download,
  ExternalLink,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Modal } from "@/components/ui/modal"
import { primaryLinkClass } from "@/components/ui/page-primitives"
interface SiteActions {
  openWallet: () => void
  showNotice: (message: string) => void
}
const SiteActionsContext = createContext<SiteActions | null>(null)
export function useSiteActions(): SiteActions {
  const context = useContext(SiteActionsContext)
  if (!context)
    throw new Error("useSiteActions must be used within SiteActionsProvider")
  return context
}
export function SiteActionsProvider({ children }: { children: ReactNode }) {
  const [walletOpen, setWalletOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  return (
    <SiteActionsContext.Provider
      value={{ openWallet: () => setWalletOpen(true), showNotice: setNotice }}
    >
      {children}
      <Modal
        open={walletOpen}
        onOpenChange={setWalletOpen}
        title="Create Your Wallet First"
      >
        <span className="mt-4 inline-flex rounded-xl border border-blue-100 bg-blue-50 p-3 text-primary">
          <Wallet size={21} />
        </span>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          To join competitions and receive rewards, you need a crypto wallet.
          Create a wallet with MetaMask, then come back here to connect it.
        </p>
        <div className="mt-5 space-y-3">
          {[
            {
              title: "Install MetaMask",
              description:
                "Download and install the MetaMask browser extension or app.",
              icon: Download,
            },
            {
              title: "Create Your Wallet",
              description:
                "Follow MetaMask’s steps to generate, backup, and secure your wallet.",
              icon: ShieldCheck,
            },
            {
              title: "Return to Cobalt Protocol",
              description:
                "Come back to this website and click ‘Connect Wallet’ again to proceed.",
              icon: ChevronRight,
            },
          ].map(({ title, description, icon: Icon }, index) => (
            <div
              key={title}
              className="flex gap-3 rounded-xl border border-border bg-slate-50 p-4"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-primary">
                0{index + 1}
              </span>
              <div>
                <h3 className="text-sm font-bold">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {description}
                </p>
              </div>
              <Icon className="ml-auto shrink-0 text-slate-400" size={16} />
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          <TriangleAlert className="shrink-0" size={18} />
          <p>
            <strong>Security Notice:</strong> Never share your Secret Recovery
            Phrase with anyone. Cobalt Protocol will never ask for it.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className={primaryLinkClass}
          >
            Get MetaMask <ExternalLink size={15} />
          </a>
          <Button
            variant="outline"
            className="h-11"
            onClick={() => {
              setWalletOpen(false)
              setNotice(
                "Wallet connection will be available after integration. You can explore the competition and profile previews now."
              )
            }}
          >
            I’ve Created My Wallet
          </Button>
        </div>
      </Modal>
      <Modal
        open={notice !== null}
        onOpenChange={(open) => {
          if (!open) setNotice(null)
        }}
        title="Cobalt Protocol"
      >
        <p className="mt-5 text-sm leading-7 text-muted-foreground">{notice}</p>
        <Button className="mt-6 h-10 w-full" onClick={() => setNotice(null)}>
          Got it
        </Button>
      </Modal>
    </SiteActionsContext.Provider>
  )
}

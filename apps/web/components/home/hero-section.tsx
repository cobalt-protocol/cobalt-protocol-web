"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  ExternalLink,
  Gauge,
  Gavel,
  LockKeyhole,
  SearchCheck,
  ShieldCheck,
  SquareTerminal,
  Users,
  Wallet,
  Zap,
} from "lucide-react"
import { routes } from "@/lib/routes"
import { fetchDashboard } from "@/lib/dashboard-api"
import styles from "./home.module.css"

const lifecycle = [
  {
    title: "Discover",
    text: "Search curated, pre-funded events",
    icon: SearchCheck,
  },
  {
    title: "Team Up",
    text: "AI matching for your preferred skills",
    icon: Users,
  },
  {
    title: "Compete",
    text: "Give your 100% best effort",
    icon: SquareTerminal,
  },
  { title: "Submit", text: "Immutable on-chain timestamps", icon: ShieldCheck },
  { title: "Win", text: "Check out the announcement board", icon: Gavel },
  {
    title: "Claim Prize",
    text: "Instant disbursement & soulbound NFT",
    icon: Wallet,
  },
]

const partners = [
  { name: "BotChain", logo: "/botchain.png", className: "rounded-[6px]" },
  { name: "Bittensor", logo: "/bittensor.webp" },
  { name: "MetaMask", logo: "/metamask.png" },
  { name: "Tether", logo: "/tether.png" },
  { name: "Indodax", logo: "/indodax.png" },
  { name: "Binance", logo: "/binance.png" },
  { name: "Bittensor", logo: "/bittensor.webp" },
]

function formatEscrowAmount(val: number | null | undefined): string {
  if (val === null || val === undefined) return "$3.4M+"
  if (val >= 1_000_000_000) {
    return `$${(val / 1_000_000_000).toFixed(2).replace(/\.00$/, "")}B+`
  }
  if (val >= 1_000_000) {
    return `$${(val / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`
  }
  if (val >= 1_000) {
    return `$${(val / 1_000).toFixed(1).replace(/\.0$/, "")}K+`
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(val)
}

function formatBuilders(val: number | null | undefined): string {
  if (val === null || val === undefined) return "42,000+"
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`
  }
  if (val >= 1_000) {
    return `${(val / 1_000).toFixed(1).replace(/\.0$/, "")}K+`
  }
  return val.toLocaleString("en-US")
}

interface HeroSectionProps {
  priceUsd?: number | null
  totalBuilders?: number | null
}

export function HeroSection({
  priceUsd: initialPriceUsd,
  totalBuilders: initialTotalBuilders,
}: HeroSectionProps = {}) {
  const [priceUsd, setPriceUsd] = useState<number | null | undefined>(initialPriceUsd)
  const [totalBuilders, setTotalBuilders] = useState<number | null | undefined>(
    initialTotalBuilders,
  )

  useEffect(() => {
    if (initialPriceUsd !== undefined && initialPriceUsd !== null) {
      setPriceUsd(initialPriceUsd)
    }
    if (initialTotalBuilders !== undefined && initialTotalBuilders !== null) {
      setTotalBuilders(initialTotalBuilders)
    }

    if (
      initialPriceUsd !== undefined &&
      initialPriceUsd !== null &&
      initialTotalBuilders !== undefined &&
      initialTotalBuilders !== null
    ) {
      return
    }

    let isMounted = true
    fetchDashboard()
      .then((data) => {
        if (isMounted && data) {
          if (
            typeof data.deposited?.price_usd === "number" &&
            (initialPriceUsd === undefined || initialPriceUsd === null)
          ) {
            setPriceUsd(data.deposited.price_usd)
          }
          if (
            typeof data.total_builders === "number" &&
            (initialTotalBuilders === undefined || initialTotalBuilders === null)
          ) {
            setTotalBuilders(data.total_builders)
          }
        }
      })
      .catch(() => {
        // Fallback gracefully to default
      })

    return () => {
      isMounted = false
    }
  }, [initialPriceUsd, initialTotalBuilders])

  const escrowValue = formatEscrowAmount(priceUsd)
  const buildersValue = formatBuilders(totalBuilders)

  return (
    <section className={styles["hero"]}>
      <div className={styles["site-container"]}>
        <div className={styles["hero-copy"]}>
          <div className={styles["hero-eyebrow"]}>
            <span>
              <Zap size={12} fill="currentColor" />
            </span>
            Secured Prize Pools <b>•</b> Zero Payout Delay <b>•</b> AI Teammate
            Matching
          </div>
          <h1>
            Compete. Win. <span>Claim the Prize.</span>
          </h1>
          <p>
            Discover global hackathons &amp; case competitions, find
            high-caliber teammates with AI skill
            <br className={styles["desktop-break"]} /> matching, and claim
            rewards instantly through pre-funded on-chain smart escrow.
          </p>
          <div className={styles["hero-actions"]}>
            <Link
              className={styles["action-primary"]}
              href={routes.competitions}
            >
              Explore Competitions <ArrowRight size={17} />
            </Link>
            <Link
              className={styles["action-white"]}
              href={routes.organization}
            >
              I&apos;m an Organizer <ExternalLink size={16} />
            </Link>
          </div>
        </div>
        <div className={styles["stats-grid"]}>
          {[
            {
              value: escrowValue,
              label: "Secured in Smart Escrow",
              icon: LockKeyhole,
            },
            {
              value: buildersValue,
              label: "Active Global Builders",
              icon: Users,
            },
            {
              value: "100%",
              label: "On-Time Payout Record",
              icon: ShieldCheck,
            },
            {
              value: "Realtime",
              label: "Average Winner Settlement",
              icon: Gauge,
            },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label}>
              <strong>
                <Icon size={20} />
                {value}
              </strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className={styles["lifecycle"]} id="how-it-works">
          <p className={styles["section-overline"]}>
            Platform lifecycle engine
          </p>
          <div className={styles["lifecycle-grid"]}>
            {lifecycle.map(({ title, text, icon: Icon }, index) => (
              <div
                key={title}
                className={`${styles["lifecycle-step"]} ${index === 5 ? styles["final-step"] : ""}`}
              >
                <span className={styles["step-icon"]}>
                  <Icon size={17} />
                </span>
                <h3>
                  {index + 1}. {title}
                </h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:mt-12 md:gap-8">
          <span className="text-xs font-medium text-[#737e95] sm:text-sm md:text-base">
            Powered by:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8">
            {partners.map((partner) => (
              <div key={partner.name} className="flex items-center gap-2">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={28}
                  height={28}
                  style={{ height: "auto", width: "auto" }}
                  className={`h-6 w-6 object-contain sm:h-7 sm:w-7 ${partner.className ?? ""}`}
                />
                <span className="text-sm font-bold text-[#1a202c] sm:text-base md:text-lg">
                  {partner.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}


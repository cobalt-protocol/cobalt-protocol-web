"use client"
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

export function HeroSection() {
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
              value: "$3.4M+",
              label: "Secured in Smart Escrow",
              icon: LockKeyhole,
            },
            {
              value: "42,000+",
              label: "Active Global Builders",
              icon: Users,
            },
            {
              value: "100%",
              label: "On-Time Payout Record",
              icon: ShieldCheck,
            },
            {
              value: "< 24h",
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
      </div>
    </section>
  )
}

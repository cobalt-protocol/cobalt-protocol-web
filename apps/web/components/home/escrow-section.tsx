import {
  ArrowDown,
  CheckCheck,
  CircleCheck,
  Gavel,
  LockKeyhole,
  Zap,
} from "lucide-react"
import styles from "./home.module.css"
export function EscrowSection() {
  return (
    <section className={styles["trust-section"]} id="escrow">
      <div className={styles["site-container"]}>
        <div className={styles["trust-panel"]}>
          <div className={styles["trust-copy"]}>
            <span className={styles["section-pill"]}>
              <LockKeyhole size={13} />
              Institutional Escrow Protocol
            </span>
            <h2>
              Know your prize is ready before you write a single line of code.
            </h2>
            <p>
              Traditional competitions leave winners waiting months with broken
              promises, arbitrary rubric shifts, and bureaucratic delays. On
              Cobalt Protocol, every organizer deposits the full prize pool into
              autonomous escrow before registration ever opens.
            </p>
            <ul>
              {[
                [
                  "Zero Payout Delays",
                  "Prize funds are disbursed automatically within seconds of judge consensus finalization.",
                ],
                [
                  "Cryptographically Verifiable Credentials",
                  "Each winner receives an on-chain soulbound badge signed by the competition organizers.",
                ],
                [
                  "Transparent Organizer Track Records",
                  "Public reputation score cards based on historical event completion and community feedback.",
                ],
              ].map(([title, text]) => (
                <li key={title}>
                  <CircleCheck size={18} />
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles["settlement"]}>
            <h3>Settlement Contract</h3>
            {[
              {
                title: "Prize Pool Secured",
                text: "Organizer deposits $50,000 into multi-sig escrow",
                status: "Verified",
                icon: CheckCheck,
              },
              {
                title: "Competition Closes",
                text: "Submissions lock irrevocably at deadline epoch",
                status: "Immutable",
                icon: LockKeyhole,
              },
              {
                title: "Jury Consensus Scoring",
                text: "Decentralized judges submit cryptographic tallies",
                status: "Consensus",
                icon: Gavel,
              },
              {
                title: "Instant Smart Claim",
                text: "Direct smart-contract release to winner wallets",
                status: "Immediate",
                icon: Zap,
              },
            ].map(({ title, text, status, icon: Icon }, index) => (
              <div key={title}>
                {index > 0 && (
                  <ArrowDown className={styles["settlement-arrow"]} size={15} />
                )}
                <div
                  className={`${styles["settlement-step"]} ${index === 3 ? styles.settled : ""}`}
                >
                  <span className={styles["settlement-number"]}>
                    {index + 1}
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                  <span className={styles["settlement-status"]}>
                    <Icon size={13} />
                    {status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

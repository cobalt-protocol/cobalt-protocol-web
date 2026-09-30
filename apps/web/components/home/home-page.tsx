import { EscrowSection } from "./escrow-section"
import { FeaturedCompetitions } from "./featured-competitions"
import { HeroSection } from "./hero-section"

export function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedCompetitions />
      <EscrowSection />
    </>
  )
}

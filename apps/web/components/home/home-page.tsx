import { EscrowSection } from "./escrow-section"
import { FeaturedCompetitions } from "./featured-competitions"
import { HeroSection } from "./hero-section"

interface HomePageProps {
  priceUsd?: number | null
  totalBuilders?: number | null
}

export function HomePage({ priceUsd, totalBuilders }: HomePageProps = {}) {
  return (
    <>
      <HeroSection priceUsd={priceUsd} totalBuilders={totalBuilders} />
      <FeaturedCompetitions />
      <EscrowSection />
    </>
  )
}

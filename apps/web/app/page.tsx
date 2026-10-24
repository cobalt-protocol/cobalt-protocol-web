import { HomePage } from "@/components/home/home-page"
import { fetchDashboard } from "@/lib/dashboard-api"

export default async function Page() {
  const dashboard = await fetchDashboard()
  const priceUsd =
    typeof dashboard?.deposited?.price_usd === "number"
      ? dashboard.deposited.price_usd
      : null
  const totalBuilders =
    typeof dashboard?.total_builders === "number"
      ? dashboard.total_builders
      : null

  return <HomePage priceUsd={priceUsd} totalBuilders={totalBuilders} />
}

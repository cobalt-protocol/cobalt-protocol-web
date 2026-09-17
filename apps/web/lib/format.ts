const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})
export const formatMoney = (amount: number): string =>
  moneyFormatter.format(amount)
export const formatNumber = (amount: number): string =>
  new Intl.NumberFormat("en-US").format(amount)
export const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value))

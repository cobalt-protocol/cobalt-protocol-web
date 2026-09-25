const moneyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})
export const formatMoney = (amount: number): string =>
  moneyFormatter.format(amount)
export const formatNumber = (amount: number): string =>
  new Intl.NumberFormat("en-US").format(amount)
export const formatDate = (value: string): string => {
  if (!value) return "TBA"
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return value
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(d)
  } catch {
    return value
  }
}

export function relocationMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}
const day = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' })
export function relocationDay(value: string | null) {
  const parsed = value ? new Date(value) : null
  return parsed && Number.isFinite(parsed.getTime()) ? day.format(parsed) : 'Not recorded'
}

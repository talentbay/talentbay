const utc = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC', hourCycle: 'h23' })

export function formatVacancyDate(value: string | null | undefined) {
  const date = value ? new Date(value) : null
  return date && Number.isFinite(date.getTime()) ? `${utc.format(date)} UTC` : 'Not recorded'
}

export function vacancyPublicationAge(value: string | null, now = Date.now()) {
  const elapsed = value ? now - Date.parse(value) : NaN
  if (!Number.isFinite(elapsed) || elapsed < 0) return null
  const days = Math.floor(elapsed / 86_400_000)
  return days ? `${days}d ago` : 'Today'
}

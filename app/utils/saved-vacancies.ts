export const savedVacanciesKey = 'talentbay:saved-vacancies'
export const savedVacanciesLimit = 200

export function parseSavedVacancies(value: string | null): string[] {
  if (!value || value.length > 64_000) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter((slug): slug is string =>
      typeof slug === 'string' && slug.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),
    ))]
  }
  catch { return [] }
}

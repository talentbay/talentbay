import { savedVacanciesKey, savedVacanciesLimit } from '~/utils/saved-vacancies'

export function useSavedVacancies() {
  const savedSlugs = useState<string[]>('saved-vacancies', () => [])
  const initialized = useState('saved-vacancies-initialized', () => false)
  const persistent = useState('saved-vacancies-persistent', () => true)

  function persist(next: string[]) {
    savedSlugs.value = next
    if (import.meta.client) {
      try {
        window.localStorage.setItem(savedVacanciesKey, JSON.stringify(next))
        persistent.value = true
      }
      catch { persistent.value = false }
    }
  }

  function isSaved(slug: string) { return savedSlugs.value.includes(slug) }
  function removeSaved(slug: string) {
    const index = savedSlugs.value.indexOf(slug)
    persist(savedSlugs.value.filter(value => value !== slug))
    return index
  }
  function restoreSaved(slug: string, index = savedSlugs.value.length) {
    if (isSaved(slug)) return
    const next = [...savedSlugs.value]
    next.splice(Math.max(0, index), 0, slug)
    persist(next)
  }
  function toggleSaved(slug: string) {
    if (isSaved(slug)) removeSaved(slug)
    else {
      if (savedSlugs.value.length >= savedVacanciesLimit) return false
      restoreSaved(slug)
    }
    return true
  }

  return { savedSlugs: readonly(savedSlugs), initialized: readonly(initialized), persistent: readonly(persistent), isSaved, toggleSaved, removeSaved, restoreSaved }
}

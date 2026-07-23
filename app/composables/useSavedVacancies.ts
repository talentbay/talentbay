const storageKey = 'talentbay:saved-vacancies'

export function useSavedVacancies() {
  const savedSlugs = useState<string[]>('saved-vacancies', () => [])
  const initialized = useState('saved-vacancies-initialized', () => false)

  onMounted(() => {
    if (initialized.value) {
      return
    }

    initialized.value = true
    try {
      const value = window.localStorage.getItem(storageKey)
      savedSlugs.value = value ? JSON.parse(value) : []
    }
    catch {
      savedSlugs.value = []
    }
  })

  function isSaved(slug: string): boolean {
    return savedSlugs.value.includes(slug)
  }

  function toggleSaved(slug: string) {
    savedSlugs.value = isSaved(slug)
      ? savedSlugs.value.filter(value => value !== slug)
      : [...savedSlugs.value, slug]

    if (import.meta.client) {
      window.localStorage.setItem(storageKey, JSON.stringify(savedSlugs.value))
    }
  }

  return {
    isSaved,
    toggleSaved,
  }
}

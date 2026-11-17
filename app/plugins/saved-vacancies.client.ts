import { parseSavedVacancies, savedVacanciesKey } from '~/utils/saved-vacancies'

export default defineNuxtPlugin((nuxtApp) => {
  const slugs = useState<string[]>('saved-vacancies', () => [])
  const initialized = useState('saved-vacancies-initialized', () => false)
  const persistent = useState('saved-vacancies-persistent', () => true)
  const readStorage = () => {
    try { slugs.value = parseSavedVacancies(window.localStorage.getItem(savedVacanciesKey)) }
    catch { persistent.value = false }
    initialized.value = true
  }
  const updateStorage = (event: StorageEvent) => {
    if (event.key === savedVacanciesKey || event.key === null) readStorage()
  }
  onNuxtReady(() => {
    readStorage()
    window.addEventListener('storage', updateStorage)
  })
  nuxtApp.vueApp.onUnmount(() => window.removeEventListener('storage', updateStorage))
})

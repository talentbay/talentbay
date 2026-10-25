import type { JobPreferences } from './useJobPreferences'

export function useVacancySearch() {
  const route = useRoute()
  const router = useRouter()
  const preferences = useJobPreferences()
  const preferencesReady = useState('job-preferences-ready', () => false)
  const text = (key: string) => typeof route.query[key] === 'string' ? route.query[key] as string : ''
  const filters = computed(() => ({
    countryCode: /^[a-z]{2}$/i.test(text('countryCode')) ? text('countryCode').toUpperCase() : 'all',
    visaSponsorship: text('visaSponsorship') === 'true',
    salaryDisclosed: text('salaryDisclosed') === 'true',
  }))
  const search = ref(text('q').slice(0, 100))
  watch(() => route.query.q, () => { search.value = text('q').slice(0, 100) })
  const query = computed(() => ({
    q: text('q').slice(0, 100) || undefined,
    countryCode: filters.value.countryCode === 'all' ? undefined : filters.value.countryCode,
    visaSponsorship: filters.value.visaSponsorship ? 'true' : undefined,
    salaryDisclosed: filters.value.salaryDisclosed ? 'true' : undefined,
    sort: 'newest', limit: 50,
  }))
  const update = (next: JobPreferences, replace = false) => router[replace ? 'replace' : 'push']({
    query: {
      q: search.value.trim() || undefined,
      countryCode: next.countryCode === 'all' ? undefined : next.countryCode,
      visaSponsorship: next.visaSponsorship ? 'true' : undefined,
      salaryDisclosed: next.salaryDisclosed ? 'true' : undefined,
    },
  })
  watch([preferencesReady, () => route.query.defaults], () => {
    if (import.meta.client && preferencesReady.value && route.query.defaults === '1') void update(preferences.value, true)
  }, { immediate: true })
  return { query, filters, search, update }
}

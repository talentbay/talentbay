export default defineNuxtPlugin(() => {
  const preferences = useJobPreferences()
  const haptics = useState('haptics-enabled', () => true)
  const ready = useState('job-preferences-ready', () => false)
  onNuxtReady(() => {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem('talentbay:preferences') || 'null')
      if (raw && typeof raw === 'object') {
        const saved = raw as Record<string, unknown>
        if (typeof saved.countryCode === 'string' && jobCountries.some(country => country.value === saved.countryCode)) preferences.value.countryCode = saved.countryCode
        if (typeof saved.visaSponsorship === 'boolean') preferences.value.visaSponsorship = saved.visaSponsorship
        if (typeof saved.salaryDisclosed === 'boolean') preferences.value.salaryDisclosed = saved.salaryDisclosed
        if (typeof saved.haptics === 'boolean') haptics.value = saved.haptics
      }
    }
    catch { /* Storage may be unavailable; preferences remain session-local. */ }
    ready.value = true
    watch([preferences, haptics], () => {
      try { localStorage.setItem('talentbay:preferences', JSON.stringify({ ...preferences.value, haptics: haptics.value })) }
      catch { /* Browsing and session-local settings continue without storage. */ }
    }, { deep: true })
  })
})

import type { ProductTheme } from '~/composables/useProductTheme'

export default defineNuxtPlugin(() => {
  const preference = useProductTheme()
  const colorMode = useColorMode()
  const { state: host } = useProductHost()
  const key = 'talentbay:theme'
  onNuxtReady(() => {
    try {
      const stored = localStorage.getItem(key) ?? colorMode.preference
      if (['system', 'light', 'dark'].includes(stored)) preference.value = stored as ProductTheme
    }
    catch { /* Storage may be unavailable; keep this session's preference in memory. */ }
    // Persist the user's choice, not the transient Telegram-resolved color scheme.
    watch(preference, (value) => {
      try { localStorage.setItem(key, value) }
      catch { /* A blocked store does not prevent appearance changes. */ }
    }, { immediate: true })
    watchEffect(() => {
      colorMode.preference = preference.value === 'system' && host.value.kind === 'telegram' ? host.value.theme : preference.value
    })
  })
})

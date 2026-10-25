export function useCandidateBack() {
  const route = useRoute()
  const router = useRouter()
  const ready = ref(false)
  onMounted(() => { ready.value = true })
  function goBack() {
    const previous = window.history.state?.back
    if (typeof previous === 'string' && previous.startsWith('/') && !previous.startsWith('//')) {
      router.back()
      return
    }
    // Pre-hydration links create native history rather than router history state.
    if (document.referrer && window.history.length > 1) {
      const referrer = new URL(document.referrer)
      if (referrer.origin === window.location.origin) { window.history.back(); return }
    }
    void router.push(route.path === '/settings' ? '/profile' : '/jobs')
  }
  return { ready, goBack }
}

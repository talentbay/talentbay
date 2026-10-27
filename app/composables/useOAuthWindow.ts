type OAuthProvider = 'GOOGLE' | 'GITHUB'

export function useOAuthWindow() {
  const { fetch: refreshSession, loggedIn } = useUserSession()
  const busy = ref<OAuthProvider | null>(null)
  const error = ref('')
  let popup: Window | null = null
  let timer: ReturnType<typeof setInterval> | undefined
  let disposed = false
  let settle: ((value: boolean) => void) | undefined

  function cleanUp() {
    clearInterval(timer)
    timer = undefined
    busy.value = null
  }

  function closePopup() {
    try { popup?.close() }
    catch { /* A restricted WebView may reject a stale window handle. */ }
  }

  async function open(provider: OAuthProvider, mode: 'login' | 'link' = 'login') {
    if (disposed || busy.value) return false
    error.value = ''
    busy.value = provider
    // Open from the click before requesting the server-sealed linking intent.
    try { popup = window.open('about:blank', 'talentbay-auth', 'width=520,height=680,scrollbars=yes') }
    catch { popup = null }
    if (!popup) {
      cleanUp()
      error.value = 'Allow the sign-in window in your browser and try again.'
      return false
    }
    try {
      const { url } = mode === 'link'
        ? await $fetch<{ url: string }>('/api/v1/auth/link', { method: 'POST', body: { provider }, timeout: 10_000 })
        : { url: `/api/v1/auth/${provider.toLowerCase()}` }
      if (disposed || popup.closed) { cleanUp(); return false }
      popup.location.href = url
      const startedAt = Date.now()
      return await new Promise<boolean>((resolve) => {
        settle = resolve
        timer = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(timer)
            timer = undefined
            void (async () => {
              try {
                await refreshSession()
                if (!loggedIn.value) throw new Error('not signed in')
                if (mode === 'link') {
                  const identities = await $fetch<{ items: { provider: string }[] }>('/api/v1/auth/identities', { timeout: 10_000 })
                  if (!identities.items.some(item => item.provider === provider)) throw new Error('not connected')
                }
                resolve(true)
              }
              catch {
                error.value = mode === 'link' ? 'This account was not connected. Try again.' : 'Sign-in was not completed. Try again.'
                resolve(false)
              }
              finally { cleanUp() }
            })()
          }
          else if (Date.now() - startedAt > 120_000) {
            closePopup()
            cleanUp()
            error.value = 'The sign-in window timed out. Try again.'
            resolve(false)
          }
        }, 500)
      })
    }
    catch {
      closePopup()
      cleanUp()
      error.value = 'Sign-in could not be started. Try again shortly.'
      return false
    }
  }
  onBeforeUnmount(() => { disposed = true; cleanUp(); closePopup(); settle?.(false) })
  return { busy, error, open }
}

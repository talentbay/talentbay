import type { ProductHostController, ProductHostState, TelegramWebApp } from '~/types/telegram'

export default defineNuxtPlugin((nuxtApp) => {
  const state = useState<ProductHostState>('product-host', () => ({
    kind: 'web', status: 'ready', message: '', haptics: false, theme: 'light',
  }))
  const hapticsEnabled = useState('haptics-enabled', () => true)
  let host: TelegramWebApp | undefined
  let backAction: (() => void) | null = null
  const router = useRouter()
  const session = useUserSession()
  const back = () => backAction?.()
  const settings = () => { void router.push('/settings') }

  function optional(action: () => void) {
    try { action() }
    catch { /* Older Telegram hosts may expose an unsupported method. */ }
  }

  const controller: ProductHostController = {
    haptic(type = 'selection') {
      if (!hapticsEnabled.value || !host?.HapticFeedback) return
      optional(() => type === 'selection'
        ? host!.HapticFeedback!.selectionChanged()
        : host!.HapticFeedback!.notificationOccurred(type))
    },
    setBackAction(action) {
      backAction = action
      if (host?.BackButton) optional(() => action ? host!.BackButton!.show() : host!.BackButton!.hide())
    },
  }

  const updateHost = () => {
    if (!host) return
    state.value.theme = host.colorScheme === 'dark' ? 'dark' : 'light'
    const style = document.documentElement.style
    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      // System and Telegram content insets describe separate obstructions.
      const raw = (host.safeAreaInset?.[side] ?? 0) + (host.contentSafeAreaInset?.[side] ?? 0)
      style.setProperty(`--host-safe-${side}`, `${Number.isFinite(raw) ? Math.max(0, Math.min(raw, 200)) : 0}px`)
    }
  }

  async function initialize() {
    const launch = new URLSearchParams(window.location.hash.slice(1))
    if (!window.Telegram?.WebApp?.initData && !launch.has('tgWebAppData')) return
    state.value.status = 'connecting'
    try {
      if (!window.Telegram?.WebApp) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          const timeout = window.setTimeout(() => reject(new Error('Host load timed out')), 5000)
          script.src = 'https://telegram.org/js/telegram-web-app.js'
          script.async = true
          script.onload = () => { clearTimeout(timeout); resolve() }
          script.onerror = () => { clearTimeout(timeout); reject(new Error('Host unavailable')) }
          document.head.append(script)
        })
      }
      host = window.Telegram?.WebApp
      if (!host?.initData) throw new Error('Launch data unavailable')
      state.value.kind = 'telegram'
      state.value.haptics = Boolean(host.HapticFeedback)
      updateHost()
      optional(() => host!.ready())
      optional(() => host?.expand?.())
      optional(() => host?.BackButton?.onClick(back))
      optional(() => host?.SettingsButton?.onClick(settings))
      optional(() => host?.SettingsButton?.show?.())
      controller.setBackAction(backAction)
      for (const event of ['safeAreaChanged', 'contentSafeAreaChanged', 'themeChanged']) optional(() => host?.onEvent?.(event, updateHost))

      await $fetch('/api/v1/auth/telegram', { method: 'POST', body: { initData: host.initData }, timeout: 10_000 })
      await session.fetch()
      const start = new URLSearchParams(host.initData).get('start_param') || ''
      const job = start.length <= 124 ? /^job_([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(start) : null
      if (job && ['/', '/jobs'].includes(router.currentRoute.value.path)) await router.replace(`/jobs/${job[1]}`)
      if (launch.has('tgWebAppData')) window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
      state.value.status = 'ready'
    }
    catch (error) {
      const status = (error as { statusCode?: number, status?: number }).statusCode ?? (error as { status?: number }).status
      state.value.status = status === 409 ? 'conflict' : 'error'
      state.value.message = status === 409
        ? 'This browser is signed in to another account. Manage your sign-in methods in Settings.'
        : 'Telegram sign-in is unavailable. You can still browse jobs or use another sign-in method.'
    }
  }

  onNuxtReady(() => { void initialize() })
  nuxtApp.vueApp.onUnmount(() => {
    optional(() => host?.BackButton?.offClick(back))
    optional(() => host?.SettingsButton?.offClick(settings))
    for (const event of ['safeAreaChanged', 'contentSafeAreaChanged', 'themeChanged']) optional(() => host?.offEvent?.(event, updateHost))
  })
  return { provide: { productHost: controller } }
})

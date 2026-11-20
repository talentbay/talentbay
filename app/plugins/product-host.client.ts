import type { ProductHostController, ProductHostState, TelegramSupportStage, TelegramWebApp } from '~/types/telegram'
import { hasCachedTelegramLaunch } from '~/utils/telegram-launch'

// Capture at client-module evaluation, before the router can normalize or remove the hash.
const launch = new URLSearchParams(window.location.hash.slice(1))
const launchInitData = launch.get('tgWebAppData') || ''

export default defineNuxtPlugin((nuxtApp) => {
  const state = useState<ProductHostState>('product-host', () => ({
    kind: 'web', status: 'ready', message: '', haptics: false, theme: 'light',
  }))
  const hapticsEnabled = useState('haptics-enabled', () => true)
  let host: TelegramWebApp | undefined
  let telegramInitData: string | null = null
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
    getTelegramInitData: () => telegramInitData,
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
    const cleanupHash = window.location.hash
    // The official SDK restores launch parameters from its cache after a hashless reload.
    // This is a loading hint only; identity still requires the server's signed-data check.
    if (!window.Telegram?.WebApp?.initData && !launch.has('tgWebAppData')
      && !hasCachedTelegramLaunch(key => window.sessionStorage.getItem(key))) return
    let navigationStarted = false
    const stopTrackingNavigation = router.beforeEach(() => { navigationStarted = true })
    state.value.status = 'connecting'
    let stage: TelegramSupportStage | undefined = 'TG-SDK'
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
      if (!host) throw new Error('Host unavailable')
      stage = 'TG-LAUNCH'
      // Navigation can remove the hash before the asynchronous SDK reads it.
      const initData = launchInitData || host.initData
      if (!initData) throw new Error('Launch data unavailable')
      telegramInitData = initData
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

      stage = 'TG-SIGNIN'
      await $fetch('/api/v1/auth/telegram', { method: 'POST', body: { initData }, timeout: 10_000 })
      stage = 'TG-SESSION'
      await session.fetch()
      // The session composable resolves signed out when its refresh request fails.
      if (!session.loggedIn.value) throw new Error('Session unavailable')
      stage = undefined
      const start = new URLSearchParams(initData).get('start_param') || ''
      const job = start.length <= 124 ? /^job_([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(start) : null
      if (job && !navigationStarted && ['/', '/jobs'].includes(router.currentRoute.value.path)) await router.replace(`/jobs/${job[1]}`)
      state.value.status = 'ready'
    }
    catch (error) {
      const failure = error as { statusCode?: unknown, status?: unknown } | null
      const status = failure?.statusCode ?? failure?.status
      state.value.status = status === 409 ? 'conflict' : 'error'
      if (status !== 409) {
        state.value.supportReference = stage === 'TG-SIGNIN'
          && typeof status === 'number' && Number.isInteger(status) && status >= 400 && status <= 599
          ? `TG-SIGNIN-${status}` : stage
      }
      state.value.message = status === 409
        ? 'This browser is signed in to another account. Manage your sign-in methods in Settings.'
        : 'Telegram sign-in is unavailable. You can still browse jobs or use another sign-in method.'
    }
    finally {
      stopTrackingNavigation()
      // The SDK must read the launch hash first; failures must not retain it either.
      if (launch.has('tgWebAppData') && window.location.hash === cleanupHash) {
        window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
      }
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

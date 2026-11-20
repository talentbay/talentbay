export type HostInsets = { top: number, right: number, bottom: number, left: number }

export type TelegramWebApp = {
  initData: string
  version?: string
  colorScheme?: 'light' | 'dark'
  safeAreaInset?: HostInsets
  contentSafeAreaInset?: HostInsets
  ready: () => void
  expand?: () => void
  onEvent?: (event: string, callback: () => void) => void
  offEvent?: (event: string, callback: () => void) => void
  BackButton?: { show: () => void, hide: () => void, onClick: (callback: () => void) => void, offClick: (callback: () => void) => void }
  SettingsButton?: { show?: () => void, onClick: (callback: () => void) => void, offClick: (callback: () => void) => void }
  HapticFeedback?: { selectionChanged: () => void, notificationOccurred: (type: 'success' | 'error' | 'warning') => void }
  openLink?: (url: string) => void
}

export type TelegramSupportStage = 'TG-SDK' | 'TG-LAUNCH' | 'TG-SIGNIN' | 'TG-SESSION'

export type ProductHostState = {
  kind: 'web' | 'telegram'
  status: 'ready' | 'connecting' | 'error' | 'conflict'
  message: string
  supportReference?: TelegramSupportStage | `TG-SIGNIN-${number}`
  haptics: boolean
  theme: 'light' | 'dark'
}

export type ProductHostController = {
  getTelegramInitData: () => string | null
  haptic: (type?: 'selection' | 'success' | 'error') => void
  setBackAction: (action: (() => void) | null) => void
}

declare global {
  interface Window { Telegram?: { WebApp?: TelegramWebApp } }
}

declare module '#app' {
  interface NuxtApp { $productHost: ProductHostController }
}

import type { ProductHostState } from '~/types/telegram'

export function useProductHost() {
  const state = useState<ProductHostState>('product-host', () => ({
    kind: 'web', status: 'ready', message: '', haptics: false, theme: 'light',
  }))
  const nuxtApp = useNuxtApp()
  return {
    state: readonly(state),
    haptic: (type?: 'selection' | 'success' | 'error') => nuxtApp.$productHost?.haptic(type),
    setBackAction: (action: (() => void) | null) => nuxtApp.$productHost?.setBackAction(action),
  }
}

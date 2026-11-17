import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useOAuthWindow } from '../../app/composables/useOAuthWindow'

const loggedIn = ref(false)
const refresh = vi.fn()
const fetch = vi.fn()
let unmount: () => void
let popup: { closed: boolean, location: { href: string }, close: () => void }
const open = vi.fn()
beforeEach(() => {
  vi.useFakeTimers()
  loggedIn.value = false
  refresh.mockReset().mockResolvedValue(undefined)
  fetch.mockReset()
  popup = { closed: false, location: { href: 'about:blank' }, close: () => { popup.closed = true } }
  open.mockReset().mockReturnValue(popup)
  vi.stubGlobal('window', { open })
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('useUserSession', () => ({ fetch: refresh, loggedIn }))
  vi.stubGlobal('$fetch', fetch)
  vi.stubGlobal('onBeforeUnmount', (callback: () => void) => { unmount = callback })
})
afterEach(() => { unmount?.(); vi.useRealTimers(); vi.unstubAllGlobals() })

describe('OAuth window capability and lifecycle (no real provider)', () => {
  it('recovers when the browser blocks the popup', async () => {
    open.mockReturnValue(null)
    const auth = useOAuthWindow()
    expect(await auth.open('GOOGLE')).toBe(false)
    expect(auth.busy.value).toBeNull()
    expect(auth.error.value).toContain('Allow the sign-in window')
    expect(refresh).not.toHaveBeenCalled()
  })
  it('recovers if a restricted WebView throws while opening the window', async () => {
    open.mockImplementation(() => { throw new Error('Restricted host') })
    const auth = useOAuthWindow()
    await expect(auth.open('GITHUB')).resolves.toBe(false)
    expect(auth.busy.value).toBeNull()
    expect(auth.error.value).toContain('sign-in window')
  })
  it('does not equate a closed popup with successful login and allows retry', async () => {
    const auth = useOAuthWindow()
    const pending = auth.open('GOOGLE')
    popup.closed = true
    await vi.advanceTimersByTimeAsync(500)
    expect(await pending).toBe(false)
    expect(auth.error.value).toContain('not completed')
    expect(auth.busy.value).toBeNull()
    expect(refresh).toHaveBeenCalledOnce()
  })
  it('refreshes the actual current session after closure and prevents duplicate popups', async () => {
    refresh.mockImplementation(async () => { loggedIn.value = true })
    const auth = useOAuthWindow()
    const pending = auth.open('GOOGLE')
    expect(popup.location.href).toBe('/api/v1/auth/google')
    expect(await auth.open('GITHUB')).toBe(false)
    expect(open).toHaveBeenCalledOnce()
    popup.closed = true
    await vi.advanceTimersByTimeAsync(500)
    expect(await pending).toBe(true)
    expect(auth.busy.value).toBeNull()
  })
  it('checks provider identities after link, not merely an existing signed-in cookie', async () => {
    loggedIn.value = true
    fetch.mockResolvedValueOnce({ url: '/api/v1/auth/github' }).mockResolvedValueOnce({ items: [{ provider: 'TELEGRAM' }] })
    const auth = useOAuthWindow()
    const pending = auth.open('GITHUB', 'link')
    await vi.advanceTimersByTimeAsync(0)
    popup.closed = true
    await vi.advanceTimersByTimeAsync(500)
    expect(await pending).toBe(false)
    expect(auth.error.value).toContain('not connected')
  })
  it('closes and permits retry after intent failure, timeout or unmount', async () => {
    fetch.mockRejectedValueOnce(new Error('Service unavailable'))
    const auth = useOAuthWindow()
    expect(await auth.open('GITHUB', 'link')).toBe(false)
    expect(popup.closed).toBe(true)
    popup.closed = false
    const pending = auth.open('GOOGLE')
    await vi.advanceTimersByTimeAsync(120_500)
    expect(await pending).toBe(false)
    expect(auth.error.value).toContain('timed out')
    popup.closed = false
    const last = auth.open('GOOGLE')
    unmount()
    expect(await last).toBe(false)
    expect(popup.closed).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })
  it('still settles on unmount if the host rejects closing a stale window handle', async () => {
    const auth = useOAuthWindow()
    const pending = auth.open('GOOGLE')
    popup.close = () => { throw new Error('Stale restricted window') }
    expect(() => unmount()).not.toThrow()
    expect(await pending).toBe(false)
    expect(auth.busy.value).toBeNull()
    expect(await auth.open('GOOGLE')).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })
})

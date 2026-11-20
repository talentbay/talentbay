import type { UserSession } from '#auth-utils'

// Unlike useUserSession().fetch(), a transport failure is not a signed-out session.
export async function readApplicationSession(signal?: AbortSignal) {
  const fresh = await $fetch<UserSession>('/api/_auth/session', {
    cache: 'no-store', retry: false, timeout: 15_000, signal,
  })
  if (!fresh || typeof fresh.id !== 'string' || !fresh.id || (fresh.user !== undefined
    && (!fresh.user || !Number.isInteger(fresh.user.id) || fresh.user.id < 1 || fresh.user.id > 2_147_483_647))) {
    throw new Error('Session could not be confirmed')
  }
  return fresh
}

<script setup lang="ts">
import type { ConnectedIdentity } from '#shared/types/auth'
const { loggedIn, clear } = useUserSession()
const { state: host } = useProductHost()
const {
  data,
  error: identitiesError,
  refresh,
} = await useAccountResource<{ items: ConnectedIdentity[] }>(
  'candidate-identities',
  '/api/v1/auth/identities',
)
const { data: capabilities } = await useFetch<{
  google: boolean
  github: boolean
  telegram: boolean
}>('/api/v1/auth/capabilities')
const { busy, error, open } = useOAuthWindow()
const linkingTelegram = ref(false)
const telegramError = ref('')
const signingOut = ref(false)
const signOutError = ref('')
const methods = computed(() =>
  [
    {
      provider: 'GOOGLE' as const,
      label: 'Google',
      icon: 'i-lucide-chrome',
      available: capabilities.value?.google,
    },
    {
      provider: 'GITHUB' as const,
      label: 'GitHub',
      icon: 'i-lucide-github',
      available: capabilities.value?.github,
    },
    {
      provider: 'TELEGRAM' as const,
      label: 'Telegram',
      icon: 'i-lucide-send',
      available: capabilities.value?.telegram && host.value.kind === 'telegram',
    },
  ].map((method) => ({
    ...method,
    identity: data.value?.items.find(
      (item) => item.provider === method.provider,
    ),
  })),
)
async function connect(provider: 'GOOGLE' | 'GITHUB' | 'TELEGRAM') {
  if (busy.value || linkingTelegram.value) return
  if (provider !== 'TELEGRAM') {
    if (await open(provider, 'link')) await refresh()
    return
  }
  linkingTelegram.value = true
  telegramError.value = ''
  try {
    const initData = window.Telegram?.WebApp?.initData
    if (!initData) throw new Error('No Telegram launch')
    await $fetch('/api/v1/auth/telegram', {
      method: 'POST',
      body: { initData, mode: 'link' },
    })
    await refresh()
  } catch {
    telegramError.value =
      'Telegram was not connected. Reopen the Mini App and try again. An identity already used by another account cannot be connected here.'
  } finally {
    linkingTelegram.value = false
  }
}
async function signOut() {
  if (signingOut.value) return
  signingOut.value = true
  signOutError.value = ''
  try {
    await clear()
    await navigateTo('/jobs')
  } catch {
    signOutError.value = 'Sign-out failed. Try again.'
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <section
    v-if="loggedIn"
    class="border-t border-default py-6"
    aria-labelledby="connected-methods-title"
  >
    <h2
      id="connected-methods-title"
      class="text-lg font-semibold text-highlighted"
    >
      Sign-in methods
    </h2>
    <UAlert
      v-if="identitiesError"
      class="mt-3"
      title="Connections could not be loaded"
      color="error"
      :actions="[{ label: 'Retry', onClick: () => refresh() }]"
    />
    <ul
      v-else
      class="mt-3 divide-y divide-default"
    >
      <li
        v-for="method in methods"
        :key="method.provider"
        class="flex min-h-20 items-center gap-3 py-3"
      >
        <UIcon
          :name="method.icon"
          class="size-5 shrink-0 text-muted"
        />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-highlighted">
            {{ method.label }}
          </p>
          <p class="mt-1 break-all text-xs text-muted">
            {{
              method.identity
                ? method.identity.email || 'Connected'
                : method.available
                  ? 'Not connected'
                  : 'Unavailable here'
            }}
          </p>
        </div>
        <UBadge
          v-if="method.identity"
          label="Connected"
          color="success"
          variant="soft"
        />
        <UButton
          v-else-if="method.available"
          label="Connect"
          variant="outline"
          :loading="
            busy === method.provider ||
            (method.provider === 'TELEGRAM' && linkingTelegram)
          "
          :disabled="Boolean(busy) || linkingTelegram || !data"
          @click="connect(method.provider)"
        />
      </li>
    </ul>
    <UAlert
      v-if="error || telegramError"
      class="mt-3"
      color="error"
      :title="error || telegramError"
    />
    <UButton
      label="Sign out"
      icon="i-lucide-log-out"
      color="neutral"
      variant="outline"
      class="mt-5"
      :loading="signingOut"
      :disabled="Boolean(busy) || linkingTelegram"
      @click="signOut"
    />
    <UAlert
      v-if="signOutError"
      class="mt-3"
      color="error"
      :title="signOutError"
    />
  </section>
</template>

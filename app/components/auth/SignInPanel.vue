<script setup lang="ts">
defineProps<{ title?: string; description?: string }>()
const emit = defineEmits<{ completed: [] }>()
const { state: host } = useProductHost()
const {
  data,
  error: capabilityError,
  refresh,
} = await useFetch<{ google: boolean; github: boolean; telegram: boolean }>(
  '/api/v1/auth/capabilities',
)
const { busy, error, open } = useOAuthWindow()
async function signIn(provider: 'GOOGLE' | 'GITHUB') {
  if (await open(provider)) emit('completed')
}
</script>

<template>
  <section
    class="mx-auto w-full max-w-md py-8"
    aria-label="Sign in"
  >
    <UIcon
      name="i-lucide-user-round"
      class="size-8 text-primary"
    />
    <h2 class="mt-3 text-2xl font-semibold text-highlighted">
      {{ title || 'Your TalentBay account' }}
    </h2>
    <p class="mt-3 text-sm leading-6 text-muted">
      {{
        description || 'Sign in to keep your profile and applications together.'
      }}
    </p>
    <div
      v-if="host.status === 'connecting'"
      class="mt-5 flex items-center gap-2 text-sm"
      role="status"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-5 animate-spin"
      />
      Signing in with Telegram
    </div>
    <div
      v-else-if="capabilityError"
      class="mt-5"
    >
      <UAlert
        title="Sign-in options are unavailable"
        color="error"
        :actions="[{ label: 'Retry', onClick: () => refresh() }]"
      />
    </div>
    <div
      v-else-if="data?.google || data?.github"
      class="mt-6 grid gap-3"
    >
      <UButton
        v-if="data.google"
        label="Continue with Google"
        icon="i-lucide-chrome"
        color="neutral"
        variant="outline"
        size="lg"
        block
        :loading="busy === 'GOOGLE'"
        :disabled="Boolean(busy)"
        @click="signIn('GOOGLE')"
      />
      <UButton
        v-if="data.github"
        label="Continue with GitHub"
        icon="i-lucide-github"
        color="neutral"
        variant="outline"
        size="lg"
        block
        :loading="busy === 'GITHUB'"
        :disabled="Boolean(busy)"
        @click="signIn('GITHUB')"
      />
    </div>
    <p
      v-else
      class="mt-5 text-sm text-muted"
      role="status"
    >
      Sign-in is not available in this preview. You can still browse and save
      jobs on this device.
    </p>
    <UAlert
      v-if="error"
      class="mt-4"
      color="error"
      :title="error"
    />
    <p class="mt-6 text-xs leading-5 text-muted">
      Before continuing, read our
      <NuxtLink
        to="/terms"
        class="text-primary underline"
      >
        Terms
      </NuxtLink>
      and
      <NuxtLink
        to="/privacy"
        class="text-primary underline"
      >
        Privacy Notice
      </NuxtLink>
      .
    </p>
  </section>
</template>

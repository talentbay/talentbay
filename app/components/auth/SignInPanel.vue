<script setup lang="ts">
import { makeVacancyStart } from '#shared/utils/telegram-vacancy-entry'
import { telegramBotEntry } from '~/utils/telegram-bot-entry'

const props = defineProps<{ title?: string; description?: string; vacancyId?: number; applicationContext?: string }>()
const emit = defineEmits<{ completed: [] }>()
const { state: host } = useProductHost()
const route = useRoute()
const {
  data,
  error: capabilityError,
  refresh,
} = await useFetch('/api/v1/auth/capabilities')
const botEntry = computed(() => telegramBotEntry(data.value, props.vacancyId, props.applicationContext))
const modalFailure = computed(() => props.vacancyId !== undefined && host.value.status === 'error')
const matchesVacancyEntry = computed(() => typeof route.query.entry === 'string' && props.vacancyId !== undefined
  && route.query.entry === makeVacancyStart(props.vacancyId, props.applicationContext))
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
    <AuthTelegramFailureAlert v-if="modalFailure" :vacancy-entry="matchesVacancyEntry" class="mt-5" />
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
    <div
      v-else-if="botEntry && host.kind === 'web' && host.status === 'ready'"
      class="mt-5"
    >
      <p class="text-sm text-muted">
        {{ botEntry.opensRole
          ? "In Telegram, choose Start, then use the bot's button to open this role. This browser stays signed out."
          : 'In Telegram, choose Start, then Open TalentBay. This browser stays signed out.' }}
      </p>
      <UButton
        :to="botEntry.href"
        external
        target="_blank"
        rel="noopener noreferrer"
        :label="botEntry.opensRole ? 'Open this role in Telegram' : 'Open Telegram bot'"
        icon="i-lucide-send"
        size="lg"
        block
        class="mt-3"
      />
    </div>
    <p
      v-else-if="!modalFailure && data?.telegram"
      class="mt-5 text-sm text-muted"
      role="status"
    >
      {{ host.status === 'error'
        ? 'You are not signed in to TalentBay.'
        : host.status === 'conflict'
          ? 'Manage your sign-in methods in Settings to connect this Telegram account.'
          : 'Open TalentBay from its Telegram bot to sign in.' }}
    </p>
    <p
      v-else-if="!modalFailure"
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

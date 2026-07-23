<script setup lang="ts">
definePageMeta({
  layout: 'product',
})

useSeoMeta({
  title: 'Sign in · TalentBay',
  description: 'Sign in to TalentBay with a verified Google or GitHub account.',
})

const route = useRoute()
const { loggedIn, fetch: refreshSession } = useUserSession()
const activeProvider = ref<'google' | 'github' | null>(null)
const errorMessage = ref('')
let popupTimer: number | undefined

const redirectTo = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string'
    && redirect.startsWith('/')
    && !redirect.startsWith('//')
    ? redirect
    : '/jobs'
})

async function completeLogin() {
  await refreshSession()
  if (loggedIn.value) {
    await navigateTo(redirectTo.value)
    return
  }

  errorMessage.value = 'Sign-in was not completed. Please try again.'
}

function loginWithPopup(provider: 'google' | 'github') {
  errorMessage.value = ''
  activeProvider.value = provider

  const width = 520
  const height = 680
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2)
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2)
  const popup = window.open(
    `/api/v1/auth/${provider}`,
    'talentbay-auth',
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`,
  )

  if (!popup) {
    activeProvider.value = null
    errorMessage.value = 'The sign-in window was blocked. Allow pop-ups for TalentBay and try again.'
    return
  }

  const startedAt = Date.now()
  popupTimer = window.setInterval(async () => {
    if (popup.closed) {
      window.clearInterval(popupTimer)
      popupTimer = undefined
      activeProvider.value = null
      await completeLogin()
      return
    }

    if (Date.now() - startedAt > 120_000) {
      window.clearInterval(popupTimer)
      popupTimer = undefined
      popup.close()
      activeProvider.value = null
      errorMessage.value = 'The sign-in window timed out. Please try again.'
    }
  }, 500)
}

onMounted(async () => {
  if (loggedIn.value) {
    await navigateTo(redirectTo.value)
  }
})

onBeforeUnmount(() => {
  if (popupTimer) {
    window.clearInterval(popupTimer)
  }
})
</script>

<template>
  <UContainer class="py-12 sm:py-20">
    <section class="mx-auto max-w-md" aria-labelledby="sign-in-title">
      <div class="text-center">
        <span class="mx-auto flex size-11 items-center justify-center rounded-md bg-talent-navy-900 text-lg font-bold text-white">
          T
        </span>
        <h1 id="sign-in-title" class="mt-5 text-3xl font-bold text-highlighted">
          Sign in to TalentBay
        </h1>
        <p class="mt-3 text-sm leading-6 text-muted">
          Use a verified account. Your TalentBay profile is created on your first sign-in.
        </p>
      </div>

      <div class="mt-8 rounded-lg border border-default bg-elevated p-5 sm:p-6">
        <div class="grid gap-3">
          <UButton
            label="Continue with Google"
            icon="i-lucide-chrome"
            color="neutral"
            variant="outline"
            size="lg"
            block
            :loading="activeProvider === 'google'"
            :disabled="activeProvider !== null"
            @click="loginWithPopup('google')"
          />
          <UButton
            label="Continue with GitHub"
            icon="i-lucide-github"
            color="neutral"
            variant="outline"
            size="lg"
            block
            :loading="activeProvider === 'github'"
            :disabled="activeProvider !== null"
            @click="loginWithPopup('github')"
          />
        </div>

        <UAlert
          v-if="errorMessage"
          class="mt-4"
          color="error"
          variant="soft"
          icon="i-lucide-triangle-alert"
          title="Unable to sign in"
          :description="errorMessage"
        />

        <p class="mt-5 text-center text-xs leading-5 text-muted">
          By continuing, you agree to the
          <NuxtLink to="/terms" class="font-semibold text-primary">Terms</NuxtLink>
          and acknowledge the
          <NuxtLink to="/privacy" class="font-semibold text-primary">Privacy Policy</NuxtLink>.
        </p>
      </div>
    </section>
  </UContainer>
</template>

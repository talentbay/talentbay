<script setup lang="ts">
const route = useRoute()
const { user, clear } = useUserSession()

const navigation = [
  { label: 'Overview', to: '/ktulhu/v1', icon: 'i-lucide-layout-dashboard' },
  { label: 'Vacancies', to: '/ktulhu/v1/vacancies', icon: 'i-lucide-briefcase-business' },
  { label: 'Users', to: '/ktulhu/v1/users', icon: 'i-lucide-users' },
]

async function signOut() {
  await clear()
  await navigateTo('/jobs')
}
</script>

<template>
  <div class="min-h-screen bg-muted">
    <header class="sticky top-0 z-40 border-b border-default bg-elevated/95 backdrop-blur">
      <UContainer class="flex min-h-16 flex-wrap items-center gap-x-6 gap-y-2 py-2">
        <NuxtLink
          to="/ktulhu/v1"
          class="flex items-center gap-2 text-highlighted"
          aria-label="TalentBay admin overview"
        >
          <span class="flex size-8 items-center justify-center rounded-md bg-talent-navy-900 text-sm font-bold text-white">
            T
          </span>
          <span class="font-bold">TalentBay Admin</span>
        </NuxtLink>

        <nav class="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto" aria-label="Admin navigation">
          <UButton
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            :label="item.label"
            :icon="item.icon"
            color="neutral"
            :variant="route.path === item.to ? 'soft' : 'ghost'"
            size="sm"
          />
        </nav>

        <div class="ml-auto flex items-center gap-2">
          <span class="hidden max-w-40 truncate text-sm text-muted md:block">
            {{ user?.email }}
          </span>
          <UButton
            to="/jobs"
            icon="i-lucide-external-link"
            color="neutral"
            variant="ghost"
            square
            aria-label="Open public site"
          />
          <UButton
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            square
            aria-label="Sign out"
            @click="signOut"
          />
        </div>
      </UContainer>
    </header>

    <ProductLocalReviewNotice />
    <main>
      <UContainer class="py-8 sm:py-10">
        <slot />
      </UContainer>
    </main>
  </div>
</template>

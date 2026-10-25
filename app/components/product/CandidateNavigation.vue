<script setup lang="ts">
const route = useRoute()
const { loggedIn, user } = useUserSession()
const tabs = [
  { label: 'Jobs', to: '/jobs', icon: 'i-lucide-search' },
  { label: 'Saved', to: '/saved', icon: 'i-lucide-heart' },
  {
    label: 'Applications',
    to: '/applications',
    icon: 'i-lucide-briefcase-business',
  },
  { label: 'Profile', to: '/profile', icon: 'i-lucide-user-round' },
]
const active = (to: string) =>
  route.path === to || (to === '/profile' && route.path === '/settings')
const topLevel = computed(() => tabs.some((tab) => tab.to === route.path))
const { ready, goBack } = useCandidateBack()
const { setBackAction } = useProductHost()
const title = computed(() =>
  route.path === '/settings'
    ? 'Settings'
    : route.path.startsWith('/jobs/')
      ? 'Vacancy'
      : 'TalentBay',
)

watch(topLevel, (value) => setBackAction(value ? null : goBack), {
  immediate: true,
})
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-default bg-elevated"
    :style="{
      paddingTop:
        'max(env(safe-area-inset-top, 0px), var(--host-safe-top, 0px))',
    }"
  >
    <div
      class="product-container flex h-14 items-center justify-between gap-3 lg:h-18"
    >
      <div class="flex min-w-0 items-center gap-2.5">
        <UButton
          v-if="!topLevel"
          :disabled="!ready"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          aria-label="Go back"
          class="min-h-11 min-w-11 lg:hidden"
          @click="goBack"
        />
        <NuxtLink
          to="/jobs"
          aria-label="TalentBay jobs"
          class="flex items-center gap-2.5 text-highlighted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          :class="{ 'hidden lg:flex': !topLevel }"
        >
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-inverted text-sm font-semibold text-inverted"
          >
            T
          </span>
          <span class="text-sm font-semibold lg:text-lg lg:font-bold">
            TalentBay
          </span>
        </NuxtLink>
        <span
          v-if="!topLevel"
          class="truncate text-sm font-semibold text-highlighted lg:hidden"
        >
          {{ title }}
        </span>
      </div>
      <nav
        class="hidden items-center gap-3 lg:flex"
        aria-label="Candidate navigation"
      >
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          :aria-current="active(tab.to) ? 'page' : undefined"
          class="flex min-h-11 items-center border-b-2 px-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary"
          :class="
            active(tab.to)
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-highlighted'
          "
        >
          {{ tab.label }}
        </NuxtLink>
      </nav>
      <div class="hidden items-center gap-3 lg:flex">
        <NuxtLink
          v-if="loggedIn"
          to="/profile"
          class="flex items-center gap-2 text-sm text-muted"
        >
          <span class="max-w-32 truncate">{{ user?.name }}</span>
          <UAvatar
            :src="user?.avatarUrl || undefined"
            :alt="user?.name"
            size="sm"
          />
        </NuxtLink>
        <UButton
          v-else
          to="/user/login"
          label="Sign in"
          variant="outline"
          size="sm"
        />
      </div>
    </div>
  </header>
  <nav
    v-if="topLevel"
    class="candidate-bottom-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-default bg-elevated px-2 pt-1.5 lg:hidden"
    aria-label="Candidate navigation"
  >
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      :aria-current="active(tab.to) ? 'page' : undefined"
      class="flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 text-xs focus-visible:outline-2 focus-visible:outline-primary"
      :class="active(tab.to) ? 'text-primary' : 'text-muted'"
    >
      <UIcon
        :name="tab.icon"
        class="size-[22px] shrink-0"
      />
      <span>{{ tab.label }}</span>
    </NuxtLink>
  </nav>
</template>

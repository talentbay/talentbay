<script setup lang="ts">
const route = useRoute()
const mobileOpen = ref(false)
const { loggedIn, user } = useUserSession()

const navigation = [
  { label: 'Jobs', to: '/jobs' },
  { label: 'Relocation', to: '/jobs#relocation-preview' },
  { label: 'For companies', to: '/orgs/login' },
]

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  },
)
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-default bg-elevated/95 backdrop-blur">
    <UContainer class="flex h-18 items-center justify-between gap-6">
      <NuxtLink
        to="/jobs"
        class="flex items-center gap-2.5 text-highlighted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        aria-label="TalentBay jobs"
      >
        <span class="flex size-8 items-center justify-center rounded-md bg-talent-navy-900 text-sm font-bold text-white">
          T
        </span>
        <span class="text-lg font-bold">TalentBay</span>
      </NuxtLink>

      <nav class="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="text-sm font-medium text-default transition-colors hover:text-primary"
          active-class="text-primary"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="hidden min-w-52 items-center justify-end gap-4 md:flex">
        <span class="text-xs font-semibold text-muted">EN</span>
        <template v-if="loggedIn">
          <span class="max-w-28 truncate text-sm font-medium text-default">
            {{ user?.name || 'Profile' }}
          </span>
          <UAvatar
            :alt="user?.name || 'TalentBay user'"
            :text="user?.name?.slice(0, 2).toUpperCase() || 'TB'"
            size="sm"
          />
        </template>
        <UButton
          v-else
          to="/user/login"
          label="Sign in"
          color="primary"
          variant="outline"
          size="sm"
        />
      </div>

      <div class="flex items-center gap-2 md:hidden">
        <UAvatar
          v-if="loggedIn"
          :alt="user?.name || 'TalentBay user'"
          :text="user?.name?.slice(0, 2).toUpperCase() || 'TB'"
          size="sm"
        />
        <UButton
          icon="i-lucide-menu"
          color="neutral"
          variant="ghost"
          square
          aria-label="Open navigation"
          aria-controls="mobile-navigation"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = !mobileOpen"
        />
      </div>
    </UContainer>

    <nav
      v-if="mobileOpen"
      id="mobile-navigation"
      class="border-t border-default bg-elevated px-4 py-4 md:hidden"
      aria-label="Mobile navigation"
    >
      <UContainer class="flex flex-col gap-1 px-0">
        <UButton
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          :label="item.label"
          color="neutral"
          variant="ghost"
          block
          class="justify-start"
        />
        <UButton
          v-if="!loggedIn"
          to="/user/login"
          label="Sign in"
          color="primary"
          variant="outline"
          block
          class="mt-2"
        />
      </UContainer>
    </nav>
  </header>
</template>

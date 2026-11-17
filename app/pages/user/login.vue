<script setup lang="ts">
definePageMeta({ layout: 'product' })
useSeoMeta({ title: 'Sign in · TalentBay', robots: 'noindex' })
const route = useRoute()
const { loggedIn } = useUserSession()
const redirect = computed(() => {
  const value = route.query.redirect
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\')
    ? value
    : '/profile'
})
watch(
  loggedIn,
  (value) => {
    if (import.meta.client && value) void navigateTo(redirect.value)
  },
  { immediate: true },
)
</script>

<template>
  <div class="product-container py-5 lg:py-10">
    <h1 class="sr-only">Sign in to TalentBay</h1>
    <AuthSignInPanel />
  </div>
</template>

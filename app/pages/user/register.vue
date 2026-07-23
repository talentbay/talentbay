<script setup lang="ts">
const route = useRoute()
const redirect = typeof route.query.redirect === 'string'
  ? route.query.redirect
  : undefined

await navigateTo({
  path: '/user/login',
  query: redirect ? { redirect } : undefined,
}, { replace: true })
</script>

<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin', middleware: 'auth', authRole: 'ADMIN',
  validate: route => route.params.record === 'new' || (/^[1-9]\d{0,9}$/.test(String(route.params.record)) && Number(route.params.record) <= 2147483647),
})
const route = useRoute()
const { user } = useUserSession()
</script>

<template>
  <AdminVacancyEditor v-if="user?.role === 'ADMIN'" :id="route.params.record === 'new' ? null : Number(route.params.record)" :key="`${user.id}:${route.params.record}`" />
</template>

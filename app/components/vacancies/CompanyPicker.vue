<script setup lang="ts">
import type { VacancyCompanyOption } from '#shared/types/vacancies'

const selected = defineModel<VacancyCompanyOption | null>({ required: true })
const searchInput = { placeholder: 'Search companies', 'aria-label': 'Search companies', maxlength: 120 }
const open = ref(false)
const search = ref('')
const options = ref<VacancyCompanyOption[]>([])
const state = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const retry = ref(0)
watch([open, search, retry], ([visible, term], _, cleanup) => {
  if (!visible) return
  const controller = new AbortController()
  state.value = 'loading'; options.value = []
  const timer = setTimeout(async () => {
    try {
      const result = await $fetch('/api/v1/job-filters/companies', { query: { q: term.trim() }, signal: controller.signal })
      if (!controller.signal.aborted) { options.value = result.items; state.value = 'ready' }
    } catch { if (!controller.signal.aborted) state.value = 'error' }
  }, term ? 180 : 0)
  cleanup(() => { clearTimeout(timer); controller.abort() })
})
</script>

<template>
  <USelectMenu
    v-model="selected" v-model:open="open" v-model:search-term="search"
    :items="options" by="slug" label-key="name" clear ignore-filter
    aria-label="Filter by company" placeholder="All companies" :loading="open && state === 'loading'"
    :search-input="searchInput"
    class="w-full"
  >
    <template #item-description="{ item }">{{ item.slug }}</template>
    <template #empty>{{ state === 'loading' ? 'Loading companies…' : state === 'error' ? 'Companies unavailable' : 'No matching companies' }}</template>
  </USelectMenu>
  <UButton v-if="state === 'error'" class="mt-1" label="Retry company search" icon="i-lucide-refresh-cw" color="neutral" variant="ghost" @click="open = true; retry++" />
</template>

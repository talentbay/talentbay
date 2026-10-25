<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)
useSeoMeta({
  title: () =>
    `${notFound.value ? 'Page not found' : 'Something went wrong'} · TalentBay`,
  robots: 'noindex',
})
const retrying = ref(false)
const ready = ref(false)
onMounted(() => {
  ready.value = true
})
async function retry() {
  if (retrying.value) return
  retrying.value = true
  try {
    await clearError()
  } finally {
    retrying.value = false
  }
}
</script>

<template>
  <UApp>
    <ProductAppShell>
      <div class="product-container py-12 lg:py-20">
        <UIcon
          :name="notFound ? 'i-lucide-file-search' : 'i-lucide-triangle-alert'"
          class="size-10 text-muted"
        />
        <h1 class="mt-4 text-[32px] leading-10 font-bold text-highlighted">
          {{ notFound ? 'Page not found' : 'Something went wrong' }}
        </h1>
        <p class="mt-3 max-w-xl text-base leading-6 text-muted">
          {{
            notFound
              ? 'This page may have moved, or the vacancy is no longer available.'
              : 'We could not load this page. Try again shortly.'
          }}
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <UButton
            v-if="!notFound"
            label="Try again"
            icon="i-lucide-refresh-cw"
            :loading="retrying"
            :disabled="!ready"
            @click="retry"
          />
          <UButton
            label="Browse jobs"
            icon="i-lucide-search"
            :variant="notFound ? 'solid' : 'outline'"
            :disabled="!ready"
            @click="clearError({ redirect: '/jobs' })"
          />
        </div>
      </div>
    </ProductAppShell>
  </UApp>
</template>

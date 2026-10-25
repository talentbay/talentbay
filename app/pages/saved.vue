<script setup lang="ts">
import type { VacancyResolveResponse } from '#shared/types/vacancies'

definePageMeta({ layout: 'product' })
useSeoMeta({ title: 'Saved jobs · TalentBay', robots: 'noindex' })
const { savedSlugs, initialized, persistent, removeSaved, restoreSaved } =
  useSavedVacancies()
const toast = useToast()
const page = ref(1)
const visibleSlugs = computed(() =>
  [...savedSlugs.value].reverse().slice((page.value - 1) * 20, page.value * 20),
)
const pages = computed(() =>
  Math.max(1, Math.ceil(savedSlugs.value.length / 20)),
)
watch(pages, (value) => {
  if (page.value > value) page.value = value
})

const { data, status, error, execute } = await useFetch<VacancyResolveResponse>(
  '/api/v1/vacancies/resolve',
  {
    method: 'POST',
    body: computed(() => ({ slugs: visibleSlugs.value })),
    server: false,
    immediate: false,
    watch: false,
  },
)
watch(
  [initialized, visibleSlugs],
  () => {
    if (import.meta.client && initialized.value && visibleSlugs.value.length)
      void execute()
  },
  { immediate: true },
)

const entries = computed(() =>
  visibleSlugs.value.map((slug) => ({
    slug,
    vacancy: data.value?.items.find((item) => item.slug === slug),
    unavailable: data.value?.unavailableSlugs.includes(slug) ?? false,
  })),
)

function removed(slug: string, position: number) {
  toast.add({
    title: 'Removed from Saved',
    actions: [{ label: 'Undo', onClick: () => restoreSaved(slug, position) }],
  })
}
function remove(slug: string) {
  removed(slug, removeSaved(slug))
}
</script>

<template>
  <div class="product-container py-5 lg:py-10">
    <h1 class="text-[32px] leading-10 font-bold text-highlighted">
      Saved jobs
    </h1>
    <p class="mt-3 text-base text-default">
      Keep interesting roles here while you compare them.
    </p>
    <p class="mt-3 text-sm text-muted">
      {{ savedSlugs.length }} saved
      {{ savedSlugs.length === 1 ? 'role' : 'roles' }} ·
      {{ persistent ? 'On this device' : 'This session only' }}
    </p>

    <div class="mt-4 max-w-[880px] space-y-3">
      <USkeleton
        v-if="!initialized"
        class="h-56 w-full rounded-lg"
        aria-label="Loading saved jobs"
      />
      <UEmpty
        v-else-if="!savedSlugs.length"
        icon="i-lucide-heart"
        title="Your shortlist starts here"
        description="Save a role that interests you and come back to compare it."
        :actions="[{ label: 'Browse jobs', to: '/jobs' }]"
      />
      <template v-else>
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          title="Saved jobs could not be refreshed"
          description="Your saved list is still here."
          :actions="[{ label: 'Retry', onClick: () => execute() }]"
        />
        <template
          v-for="entry in entries"
          :key="entry.slug"
        >
          <VacanciesVacancyCard
            v-if="entry.vacancy"
            :vacancy="entry.vacancy"
            @removed="removed"
          />
          <div
            v-else-if="entry.unavailable"
            class="flex items-center justify-between gap-4 rounded-lg border border-default bg-elevated p-4"
          >
            <div class="min-w-0">
              <p class="font-semibold text-highlighted">
                This vacancy is no longer available
              </p>
              <p class="mt-1 break-all text-xs text-muted">
                {{ entry.slug }}
              </p>
            </div>
            <UButton
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              aria-label="Remove unavailable vacancy"
              class="min-h-11 min-w-11 shrink-0"
              @click="remove(entry.slug)"
            />
          </div>
          <USkeleton
            v-else-if="status === 'pending'"
            class="h-56 w-full rounded-lg"
            aria-label="Loading vacancy"
          />
        </template>
        <div
          v-if="pages > 1"
          class="flex items-center justify-between pt-3"
        >
          <UButton
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="outline"
            aria-label="Previous saved jobs"
            :disabled="page === 1"
            @click="page--"
          />
          <span class="text-sm text-muted">{{ page }} / {{ pages }}</span>
          <UButton
            icon="i-lucide-chevron-right"
            color="neutral"
            variant="outline"
            aria-label="Next saved jobs"
            :disabled="page === pages"
            @click="page++"
          />
        </div>
      </template>
    </div>
  </div>
</template>

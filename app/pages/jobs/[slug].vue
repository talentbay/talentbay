<script setup lang="ts">
import type {
  RelocationLocationsResponse,
  VacancyListItem,
} from '#shared/types/vacancies'
import {
  annualSalaryMidpoint,
  formatVacancySalary,
} from '~/utils/vacancy-salary'
import { parseVacancyStart } from '#shared/utils/telegram-vacancy-entry'

definePageMeta({
  layout: 'product',
  key: route => {
    const entry = route.query.entry
    const variant = entry === undefined ? 'canonical' : parseVacancyStart(entry) ? entry : 'invalid'
    return JSON.stringify([route.params.slug, variant])
  },
})
const route = useRoute()
const slug = String(route.params.slug)
const entry = route.query.entry
if (entry !== undefined) {
  if (import.meta.server) useResponseHeader('Cache-Control').value = 'no-store'
  if (typeof entry !== 'string' || !parseVacancyStart(entry)) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found', fatal: true })
}
const { data: vacancy, error } = await useFetch<VacancyListItem>(
  `/api/v1/vacancies/${slug}`,
  { query: typeof entry === 'string' ? { entry } : undefined },
)
if (error.value || !vacancy.value)
  throw createError({
    statusCode: error.value?.statusCode || 404,
    statusMessage: 'Vacancy not found',
    fatal: true,
  })
useSeoMeta({
  robots: entry === undefined ? undefined : 'noindex',
  title: () =>
    `${vacancy.value?.title} at ${vacancy.value?.company.name} · TalentBay`,
  description: () => vacancy.value?.summary,
})
const { data: locations } = await useFetch<RelocationLocationsResponse>('/api/v1/relocation/locations', { key: 'relocation-locations' })
const relocationLocation = computed(() =>
  locations.value?.destinations.find(
    (item) =>
      item.countryCode === vacancy.value?.location.countryCode &&
      item.city.toLocaleLowerCase('en') ===
        vacancy.value?.location.city?.toLocaleLowerCase('en'),
  ),
)
const relocationSalary = computed(() =>
  vacancy.value?.salary?.currency === relocationLocation.value?.currency
    ? annualSalaryMidpoint(vacancy.value?.salary || null)
    : null,
)
const sourceUrl = computed(() => safeHttpUrl(vacancy.value?.source.url))
const location = computed(() =>
  [
    vacancy.value?.location.city,
    vacancy.value?.location.countryName,
    vacancy.value?.workplaceType.toLowerCase(),
  ]
    .filter(Boolean)
    .join(' · '),
)
const relocationOpen = ref(false)
const { ready, goBack } = useCandidateBack()
const originalId = vacancy.value.id
async function reloadListing(signal: AbortSignal): Promise<'updated' | 'unavailable' | 'retry'> {
  try {
    // Commit only a successful read of the same listing; the open draft belongs to it.
    const updated = await $fetch<VacancyListItem>(`/api/v1/vacancies/${encodeURIComponent(slug)}`, {
      query: typeof entry === 'string' ? { entry } : undefined,
      cache: 'no-store', retry: 0, signal,
    })
    if (signal.aborted) return 'retry'
    if (updated.id !== originalId || updated.source.status !== 'VERIFIED' || !updated.applicationContext) return 'unavailable'
    vacancy.value = updated
    return 'updated'
  } catch (cause) {
    return (cause as { statusCode?: number }).statusCode === 404 ? 'unavailable' : 'retry'
  }
}
</script>

<template>
  <div
    v-if="vacancy"
    class="product-container py-5 lg:py-10"
  >
    <UButton
      label="Back to jobs"
      :disabled="!ready"
      icon="i-lucide-arrow-left"
      variant="link"
      class="hidden px-0 lg:inline-flex"
      @click="goBack"
    />
    <div
      class="grid items-start gap-6 lg:mt-5 lg:grid-cols-[minmax(0,1fr)_21rem]"
    >
      <article class="min-w-0">
        <header class="border-b border-default pb-6">
          <div class="flex items-center gap-3">
            <UAvatar
              :text="vacancy.company.initials"
              :alt="vacancy.company.name"
              size="xl"
              class="shrink-0"
            />
            <div class="min-w-0">
              <p class="break-words text-sm font-semibold text-primary">
                {{ vacancy.company.name }}
              </p>
              <p class="mt-1 text-xs text-muted">
                {{ location }}
              </p>
            </div>
          </div>
          <h1
            class="mt-4 break-words text-[32px] leading-10 font-bold text-highlighted"
          >
            {{ vacancy.title }}
          </h1>
          <p class="mt-3 text-2xl font-semibold text-highlighted">
            {{ formatVacancySalary(vacancy.salary) }}
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <UBadge
              :label="vacancy.seniority"
              color="neutral"
              variant="soft"
            />
            <UBadge
              v-for="skill in vacancy.skills"
              :key="skill"
              :label="skill"
              color="neutral"
              variant="soft"
            />
            <UBadge
              v-if="vacancy.relocationOffered"
              label="Relocation"
              variant="soft"
            />
            <UBadge
              v-if="vacancy.visaSponsorship"
              label="Visa support"
              color="success"
              variant="soft"
            />
          </div>
        </header>
        <UButton
          v-if="relocationLocation"
          :disabled="!ready"
          label="Relocation estimate"
          icon="i-lucide-calculator"
          trailing-icon="i-lucide-chevron-right"
          color="neutral"
          variant="outline"
          block
          class="mt-4 min-h-12 justify-between lg:hidden"
          @click="relocationOpen = true"
        />
        <section
          class="py-6"
          aria-labelledby="role-overview"
        >
          <h2
            id="role-overview"
            class="text-2xl font-semibold text-highlighted"
          >
            About the role
          </h2>
          <p
            class="mt-3 whitespace-pre-line break-words text-base leading-7 text-default"
          >
            {{ vacancy.description }}
          </p>
        </section>
        <section
          class="border-t border-default py-5"
          aria-label="Vacancy source"
        >
          <UBadge
            :label="
              vacancy.source.status === 'DEMO'
                ? 'Preview vacancy'
                : 'Reviewed listing'
            "
            :color="vacancy.source.status === 'DEMO' ? 'warning' : 'success'"
            variant="soft"
          />
          <p
            v-if="vacancy.source.status === 'DEMO'"
            class="mt-3 text-sm text-muted"
          >
            This fictional vacancy is not an active job offer.
          </p>
          <p class="mt-3 text-sm text-muted">
            Source:
            <a
              v-if="sourceUrl"
              :href="sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary underline"
            >
              {{ vacancy.source.name }}
            </a>
            <span v-else>{{ vacancy.source.name }}</span>
          </p>
          <VacanciesProvenanceDates
            v-if="vacancy.provenance"
            class="mt-4"
            :dates="[
              { label: 'Published on TalentBay', value: vacancy.publishedAt },
              { label: 'Source publication', value: vacancy.provenance.sourcePublishedAt },
              { label: 'Source fetched', value: vacancy.provenance.sourceFetchedAt },
              { label: 'Last imported', value: vacancy.provenance.lastImportedAt },
              { label: 'Content checked', value: vacancy.provenance.reviewedAt },
            ]"
          />
        </section>
        <p
          v-if="!relocationLocation"
          class="border-t border-default py-4 text-sm text-muted"
        >
          A relocation estimate for this destination is not available yet.
        </p>
      </article>
      <aside
        class="space-y-5 lg:sticky lg:top-24"
        aria-label="Vacancy actions and estimate"
      >
        <VacanciesVacancyActions :key="vacancy.id" :vacancy="vacancy" :reload-listing="reloadListing" />
        <div
          v-if="relocationLocation"
          class="hidden lg:block"
        >
          <RelocationPreview
            :context-key="vacancy.slug"
            :context-label="`${vacancy.title} · ${vacancy.company.name}`"
            :initial-location="relocationLocation.key"
            :initial-annual-gross="relocationSalary"
          />
        </div>
      </aside>
    </div>
    <UModal
      v-model:open="relocationOpen"
      title="Relocation estimate"
      :description="`${vacancy.title} · ${vacancy.company.name}`"
      :ui="{ header: 'shrink-0 items-start', wrapper: 'min-w-0 pe-10', title: 'break-words', description: 'break-words', body: 'min-h-0' }"
    >
      <template #body>
        <RelocationPreview
          v-if="relocationLocation"
          embedded
          :context-key="vacancy.slug"
          :initial-location="relocationLocation.key"
          :initial-annual-gross="relocationSalary"
        />
      </template>
    </UModal>
  </div>
</template>

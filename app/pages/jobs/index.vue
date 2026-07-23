<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import type { VacancySearchResponse } from '#shared/types/vacancies'

definePageMeta({
  layout: 'product',
})

useSeoMeta({
  title: 'International tech jobs with relocation estimates · TalentBay',
  description: 'Search international technical roles and compare an illustrative relocation outcome before applying.',
})

const search = ref('')
const countryCode = ref('all')
const visaSponsorship = ref(false)
const salaryDisclosed = ref(false)
const sort = ref<'newest' | 'salary-desc'>('newest')
const debouncedSearch = refDebounced(search, 250)

const countryItems = [
  { label: 'All locations', value: 'all' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'Netherlands', value: 'NL' },
  { label: 'Germany', value: 'DE' },
  { label: 'Portugal', value: 'PT' },
]

const sortItems = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Highest salary', value: 'salary-desc' },
]

const query = computed(() => ({
  q: debouncedSearch.value || undefined,
  countryCode: countryCode.value === 'all' ? undefined : countryCode.value,
  visaSponsorship: visaSponsorship.value ? 'true' : undefined,
  salaryDisclosed: salaryDisclosed.value ? 'true' : undefined,
  sort: sort.value,
}))

const { data, status, error, refresh } = await useFetch<VacancySearchResponse>(
  '/api/v1/vacancies',
  { query },
)

const submitSearch = () => refresh()
</script>

<template>
  <UContainer class="py-10 sm:py-12">
    <section aria-labelledby="jobs-title">
      <h1 id="jobs-title" class="max-w-4xl text-3xl font-bold text-highlighted sm:text-4xl">
        Jobs that make relocation add up
      </h1>
      <p class="mt-3 max-w-3xl text-base text-default">
        Search technical roles and compare the destination outcome in the same workflow.
      </p>

      <form
        class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(20rem,1fr)_14rem_auto]"
        role="search"
        @submit.prevent="submitSearch"
      >
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Role, skill or company"
          aria-label="Search vacancies"
          size="lg"
        />
        <USelect
          v-model="countryCode"
          :items="countryItems"
          value-key="value"
          aria-label="Filter by location"
          size="lg"
        />
        <UButton type="submit" label="Search" icon="i-lucide-search" size="lg" />
      </form>

      <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <UCheckbox v-model="visaSponsorship" label="Visa support" />
        <UCheckbox v-model="salaryDisclosed" label="Salary disclosed" />
      </div>
    </section>

    <UAlert
      v-if="data?.dataStatus === 'DEMO'"
      class="mt-8"
      color="warning"
      variant="soft"
      icon="i-lucide-flask-conical"
      title="Preview dataset"
      description="Vacancies and relocation figures are illustrative until verified sources and the production database are connected."
    />

    <div class="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <section aria-labelledby="results-title">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="results-title" class="text-2xl font-semibold text-highlighted">
            {{ data?.total ?? 0 }} roles
          </h2>
          <USelect
            v-model="sort"
            :items="sortItems"
            value-key="value"
            aria-label="Sort vacancies"
            class="w-48"
          />
        </div>

        <div v-if="status === 'pending' && !data" class="space-y-4" aria-label="Loading vacancies">
          <USkeleton v-for="index in 3" :key="index" class="h-56 w-full rounded-lg" />
        </div>

        <UAlert
          v-else-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-triangle-alert"
          title="Vacancies unavailable"
          description="The vacancy API did not respond. Try again."
          :actions="[{ label: 'Retry', onClick: () => refresh() }]"
        />

        <div v-else-if="data?.items.length" class="space-y-4">
          <VacanciesVacancyCard
            v-for="vacancy in data.items"
            :key="vacancy.id"
            :vacancy="vacancy"
          />
        </div>

        <UEmpty
          v-else
          icon="i-lucide-search-x"
          title="No matching vacancies"
          description="Change the search or remove a filter."
        />
      </section>

      <RelocationPreview />
    </div>
  </UContainer>
</template>

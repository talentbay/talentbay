<script setup lang="ts">
import type { VacancyCompanyOption, VacancySearchResponse } from '#shared/types/vacancies'

definePageMeta({ layout: 'product' })
useSeoMeta({
  title: 'International tech jobs with relocation estimates · TalentBay',
  description:
    'Compare international technical roles and destination costs before your next move.',
})
const { query, filters, search, update } = useVacancySearch()
const route = useRoute()
const { data, status, error, refresh } = await useFetch<VacancySearchResponse>(
  '/api/v1/vacancies',
  { query },
)
const filtersOpen = ref(false)
const pickedCompany = ref<VacancyCompanyOption | null>(null)
const companyName = computed(() => {
  const slug = filters.value.company
  const first = data.value?.items[0]?.company
  return first?.slug === slug ? first.name : pickedCompany.value?.slug === slug ? pickedCompany.value.name : slug
})
const interactive = ref(false)
onMounted(() => {
  interactive.value = true
})
const draft = reactive({
  countryCode: 'all',
  visaSponsorship: false,
  salaryDisclosed: false,
})
watch(filtersOpen, (value) => {
  if (value) {
    Object.assign(draft, filters.value)
    pickedCompany.value = filters.value.company ? { slug: filters.value.company, name: companyName.value } : null
  }
})
const count = computed(
  () =>
    Number(Boolean(filters.value.company)) + Number(filters.value.countryCode !== 'all') +
    Number(filters.value.visaSponsorship) +
    Number(filters.value.salaryDisclosed),
)
const hasAppliedCriteria = computed(() => Boolean(query.value.q?.trim() || count.value))
const resultsReady = computed(() => status.value === 'success' && Boolean(data.value))
const countryName = computed(() =>
  filters.value.countryCode === 'all'
    ? ''
    : new Intl.DisplayNames(['en'], { type: 'region' }).of(
        filters.value.countryCode,
      ),
)
async function applyFilters() {
  await update({ ...draft, company: pickedCompany.value?.slug })
  filtersOpen.value = false
}
async function submit() {
  await update(filters.value)
  await refresh()
}
</script>

<template>
  <div class="product-container py-5 lg:py-10">
    <h1 class="text-[32px] leading-10 font-bold text-highlighted">
      Jobs that add up
    </h1>
    <p class="mt-3 text-base text-default">
      Compare the role and destination outcome together.
    </p>
    <form
      class="mt-4 flex max-w-3xl items-center gap-2"
      role="search"
      @submit.prevent="submit"
    >
      <UInput
        v-model="search"
        :disabled="!interactive"
        icon="i-lucide-search"
        placeholder="Role, skill or company"
        aria-label="Search vacancies"
        maxlength="100"
        size="xl"
        class="min-w-0 flex-1"
        :ui="{ base: 'min-h-11' }"
      />
      <UTooltip text="Search">
        <UButton
          type="submit"
          :disabled="!interactive"
          icon="i-lucide-arrow-right"
          aria-label="Search"
          variant="outline"
          class="size-11 shrink-0 justify-center p-0"
        />
      </UTooltip>
      <UTooltip text="Filters">
        <UButton
          icon="i-lucide-sliders-horizontal"
          :disabled="!interactive"
          :aria-label="`Filters${count ? ` (${count} active)` : ''}`"
          color="neutral"
          variant="outline"
          class="min-h-11 min-w-11 shrink-0 justify-center"
          @click="filtersOpen = true"
        >
          <span
            v-if="count"
            class="text-xs"
          >
            {{ count }}
          </span>
        </UButton>
      </UTooltip>
    </form>
    <div
      v-if="count"
      class="mt-3 flex flex-wrap items-center gap-2"
      aria-label="Active filters"
    >
      <UButton
        v-if="filters.company" :label="companyName" trailing-icon="i-lucide-x"
        :aria-label="`Remove company filter: ${companyName}`" variant="soft" size="xs"
        class="min-h-11 max-w-full" @click="update({ ...filters, company: undefined })"
      />
      <UButton
        v-if="countryName"
        :label="countryName"
        trailing-icon="i-lucide-x"
        :aria-label="`Remove ${countryName} filter`"
        variant="soft"
        size="xs"
        class="min-h-11"
        @click="update({ ...filters, countryCode: 'all' })"
      />
      <UButton
        v-if="filters.visaSponsorship"
        label="Visa support"
        trailing-icon="i-lucide-x"
        aria-label="Remove visa support filter"
        color="success"
        variant="soft"
        size="xs"
        class="min-h-11"
        @click="update({ ...filters, visaSponsorship: false })"
      />
      <UButton
        v-if="filters.salaryDisclosed"
        label="Salary disclosed"
        trailing-icon="i-lucide-x"
        aria-label="Remove salary disclosed filter"
        variant="soft"
        size="xs"
        class="min-h-11"
        @click="update({ ...filters, salaryDisclosed: false })"
      />
      <UButton
        label="Clear filters"
        color="neutral"
        variant="link"
        size="xs"
        class="min-h-11"
        @click="
          update({
            countryCode: 'all',
            visaSponsorship: false,
            salaryDisclosed: false,
          })
        "
      />
    </div>
    <div
      v-if="resultsReady && data?.dataStatus === 'DEMO'"
      class="mt-4 flex items-start gap-2 text-xs leading-5 text-muted"
      role="note"
    >
      <UIcon
        name="i-lucide-flask-conical"
        class="mt-0.5 size-4 shrink-0"
      />
      <p>
        Preview dataset. These roles and relocation figures are illustrative.
      </p>
    </div>
    <UModal
      title="Relocation comparison"
      description="Estimate monthly income after destination costs."
      :ui="{ header: 'shrink-0 items-start', wrapper: 'min-w-0 pe-10', body: 'min-h-0' }"
    >
      <UButton
        label="Relocation comparison"
        :disabled="!interactive"
        icon="i-lucide-calculator"
        trailing-icon="i-lucide-chevron-right"
        color="neutral"
        variant="outline"
        block
        class="mt-4 min-h-12 justify-between lg:hidden"
      />
      <template #body>
        <RelocationPreview embedded />
      </template>
    </UModal>
    <div class="mt-5 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <section
        class="min-w-0"
        aria-labelledby="results-title"
        :aria-busy="status === 'pending'"
      >
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="results-title"
            class="scroll-mt-24 text-2xl font-semibold text-highlighted"
            aria-live="polite"
            aria-atomic="true"
          >
            {{ resultsReady && data ? `${data.total} ${data.total === 1 ? 'role' : 'roles'}` : 'Vacancy results' }}
          </h2>
          <span v-if="resultsReady && data?.items.length" class="text-xs text-muted">Newest first</span>
        </div>
        <div
          v-if="status === 'pending' || status === 'idle'"
          class="space-y-3"
          aria-label="Loading vacancies"
        >
          <USkeleton
            v-for="n in 3"
            :key="n"
            class="h-56 rounded-lg"
          />
        </div>
        <UAlert
          v-else-if="error || !data"
          color="error"
          title="Vacancies unavailable"
          description="Try again shortly."
          :actions="[{ label: 'Retry', class: 'min-h-11 min-w-11 justify-center', disabled: !interactive, onClick: () => refresh() }]"
        />
        <div
          v-else-if="data?.items.length"
          class="space-y-3"
        >
          <VacanciesVacancyCard
            v-for="vacancy in data.items"
            :key="vacancy.id"
            :vacancy="vacancy"
          />
        </div>
        <UEmpty
          v-else-if="query.before"
          icon="i-lucide-list-end"
          title="No more roles on this page"
          description="Return to the newest results for this search."
        />
        <UEmpty
          v-else-if="hasAppliedCriteria"
          icon="i-lucide-search-x"
          title="No matching vacancies"
          description="Try another search or clear your search and filters to see all roles."
        >
          <template #actions>
            <UButton to="/jobs" label="Clear search and filters" icon="i-lucide-list-restart" class="min-h-11" @click="search = ''" />
          </template>
        </UEmpty>
        <UEmpty
          v-else
          icon="i-lucide-briefcase-business"
          title="No vacancies are published right now"
          description="You can prepare your candidate profile before a role opens."
          :actions="[{ label: 'Prepare your profile', to: '/profile', icon: 'i-lucide-user-round', class: 'min-h-11' }]"
        />
        <nav v-if="query.before || (resultsReady && data?.nextCursor)" class="mt-5 flex flex-wrap gap-3" aria-label="Vacancy pages">
          <UButton v-if="query.before" :to="{ query: { ...route.query, before: undefined }, hash: '#results-title' }" icon="i-lucide-arrow-up" label="Newest roles" color="neutral" variant="outline" class="min-h-11" :disabled="status === 'pending'" />
          <UButton v-if="resultsReady && data?.nextCursor" :to="{ query: { ...route.query, before: data.nextCursor }, hash: '#results-title' }" trailing-icon="i-lucide-arrow-right" label="Older roles" color="neutral" variant="outline" class="min-h-11" />
        </nav>
      </section>
      <div class="hidden lg:block">
        <RelocationPreview />
      </div>
    </div>
    <UModal
      v-model:open="filtersOpen"
      title="Filter jobs"
      description="Choose which roles to include."
    >
      <template #body>
        <form
          id="job-filters"
          class="space-y-5"
          @submit.prevent="applyFilters"
        >
          <UFormField label="Company"><VacanciesCompanyPicker v-model="pickedCompany" /></UFormField>
          <UFormField label="Location">
            <USelect
              v-model="draft.countryCode"
              :items="jobCountries"
              aria-label="Filter by location"
              class="w-full"
            />
          </UFormField>
          <UCheckbox
            v-model="draft.visaSponsorship"
            label="Visa support"
          />
          <UCheckbox
            v-model="draft.salaryDisclosed"
            label="Salary disclosed"
          />
        </form>
      </template>
      <template #footer>
        <div class="flex w-full justify-between gap-3">
          <UButton
            label="Reset"
            color="neutral"
            variant="ghost"
            @click="
              pickedCompany = null;
              Object.assign(draft, {
                countryCode: 'all',
                visaSponsorship: false,
                salaryDisclosed: false,
              })
            "
          />
          <UButton
            type="submit"
            form="job-filters"
            label="Apply filters"
            icon="i-lucide-check"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

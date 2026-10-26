<script setup lang="ts">
import type { VacancySearchResponse } from '#shared/types/vacancies'

definePageMeta({ layout: 'product' })
useSeoMeta({
  title: 'International tech jobs with relocation estimates · TalentBay',
  description:
    'Compare international technical roles and destination costs before your next move.',
})
const { query, filters, search, update } = useVacancySearch()
const { data, status, error, refresh } = await useFetch<VacancySearchResponse>(
  '/api/v1/vacancies',
  { query },
)
const filtersOpen = ref(false)
const interactive = ref(false)
onMounted(() => {
  interactive.value = true
})
const relocationOpen = ref(false)
const draft = reactive({
  countryCode: 'all',
  visaSponsorship: false,
  salaryDisclosed: false,
})
watch(filtersOpen, (value) => {
  if (value) Object.assign(draft, filters.value)
})
const count = computed(
  () =>
    Number(filters.value.countryCode !== 'all') +
    Number(filters.value.visaSponsorship) +
    Number(filters.value.salaryDisclosed),
)
const countryName = computed(() =>
  filters.value.countryCode === 'all'
    ? ''
    : new Intl.DisplayNames(['en'], { type: 'region' }).of(
        filters.value.countryCode,
      ),
)
async function applyFilters() {
  await update(draft)
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
        v-if="countryName"
        :label="countryName"
        trailing-icon="i-lucide-x"
        :aria-label="`Remove ${countryName} filter`"
        variant="soft"
        size="xs"
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
        @click="update({ ...filters, visaSponsorship: false })"
      />
      <UButton
        v-if="filters.salaryDisclosed"
        label="Salary disclosed"
        trailing-icon="i-lucide-x"
        aria-label="Remove salary disclosed filter"
        variant="soft"
        size="xs"
        @click="update({ ...filters, salaryDisclosed: false })"
      />
      <UButton
        label="Clear"
        color="neutral"
        variant="link"
        size="xs"
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
      v-if="data?.dataStatus === 'DEMO'"
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
    <UButton
      label="Relocation comparison"
      :disabled="!interactive"
      icon="i-lucide-calculator"
      trailing-icon="i-lucide-chevron-right"
      color="neutral"
      variant="outline"
      block
      class="mt-4 min-h-12 justify-between lg:hidden"
      @click="relocationOpen = true"
    />
    <div class="mt-5 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <section
        aria-labelledby="results-title"
        :aria-busy="status === 'pending'"
      >
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="results-title"
            class="text-2xl font-semibold text-highlighted"
          >
            {{ data?.total ?? 0 }} roles
          </h2>
          <span class="text-xs text-muted">Newest first</span>
        </div>
        <div
          v-if="status === 'pending' && !data"
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
          v-else-if="error"
          color="error"
          title="Vacancies unavailable"
          description="Try again shortly."
          :actions="[{ label: 'Retry', onClick: () => refresh() }]"
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
          v-else
          icon="i-lucide-search-x"
          title="No matching vacancies"
          description="Change the search or remove a filter."
        />
        <p
          v-if="data && data.total > data.items.length"
          class="mt-4 text-sm text-muted"
        >
          Showing the {{ data.items.length }} newest matches. Narrow your search
          to find more specific roles.
        </p>
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
    <UModal
      v-model:open="relocationOpen"
      title="Relocation comparison"
      description="Estimate monthly income after destination costs."
    >
      <template #body>
        <RelocationPreview />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { safeHttpUrl } from '~/utils/safe-http-url'
type AdminVacancy = {
  id: number
  slug: string
  title: string
  companyName: string
  city: string | null
  countryCode: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  reviewStatus: 'UNREVIEWED' | 'VERIFIED' | 'FLAGGED'
  sourceName: string | null
  sourceUrl: string | null
  updatedAt: string
}

type AdminVacancyResponse = {
  items: AdminVacancy[]
  total: number
  nextCursor: string | null
}

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  authRole: 'ADMIN',
})

const route = useRoute()
const router = useRouter()
const publicOnly = computed({
  get: () => route.query.publicOnly === 'true',
  set: value => { void router.push({ query: { ...route.query, publicOnly: value ? 'true' : undefined, before: undefined, review: undefined } }) },
})
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
watch(() => route.query.q, value => { search.value = typeof value === 'string' ? value : '' })
function submitSearch() { return router.push({ query: { ...route.query, q: search.value.trim() || undefined, before: undefined, review: undefined } }) }
const statusFilter = computed({
  get: () => ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(String(route.query.status)) ? String(route.query.status) as AdminVacancy['status'] : 'all',
  set: value => { void router.push({ query: { ...route.query, status: value === 'all' ? undefined : value, before: undefined, review: undefined } }) },
})
const reviewFilter = computed({
  get: () => ['UNREVIEWED', 'VERIFIED', 'FLAGGED'].includes(String(route.query.reviewStatus)) ? String(route.query.reviewStatus) as AdminVacancy['reviewStatus'] : 'all',
  set: value => { void router.push({ query: { ...route.query, reviewStatus: value === 'all' ? undefined : value, before: undefined, review: undefined } }) },
})
const activeVacancyId = computed({
  get: () => /^\d{1,10}$/.test(String(route.query.review)) && Number(route.query.review) > 0 && Number(route.query.review) <= 2147483647 ? Number(route.query.review) : null,
  set: value => { void router.replace({ query: { ...route.query, review: value ?? undefined }, hash: route.hash }) },
})
const reviewOpen = computed({ get: () => activeVacancyId.value !== null, set: value => { if (!value) activeVacancyId.value = null } })

const statusItems = [
  { label: 'All publication states', value: 'all' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Archived', value: 'ARCHIVED' },
]

const reviewItems = [
  { label: 'All review states', value: 'all' },
  { label: 'Unreviewed', value: 'UNREVIEWED' },
  { label: 'Verified', value: 'VERIFIED' },
  { label: 'Flagged', value: 'FLAGGED' },
]

const query = computed(() => ({
  status: statusFilter.value === 'all' ? undefined : statusFilter.value,
  reviewStatus: reviewFilter.value === 'all' ? undefined : reviewFilter.value,
  q: typeof route.query.q === 'string' ? route.query.q : undefined,
  before: typeof route.query.before === 'string' ? route.query.before : undefined,
  publicOnly: publicOnly.value ? 'true' : undefined,
}))

const { data, status, error, refresh } = await useAccountResource<AdminVacancyResponse>(
  'admin-vacancy-queue',
  '/api/v1/admin/vacancies',
  query,
)

async function reviewed() {
  activeVacancyId.value = null
  await refresh()
}
</script>

<template>
  <section class="min-w-0" aria-labelledby="vacancy-admin-title">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 id="vacancy-admin-title" class="scroll-mt-28 text-3xl font-bold text-highlighted">Vacancy review</h1>
      </div>
      <UButton to="/ktulhu/v1/import" icon="i-lucide-upload" label="Import CSV" />
    </div>

    <form class="mt-6 flex flex-wrap gap-3" role="search" @submit.prevent="submitSearch">
      <UCheckbox v-model="publicOnly" label="Publicly visible only" class="self-center" />
      <UInput v-model="search" aria-label="Search vacancy queue" placeholder="Role, company or source" maxlength="120" class="w-full sm:w-72" />
      <UButton type="submit" icon="i-lucide-search" label="Search" :disabled="status === 'pending'" />
      <USelect
        v-model="statusFilter"
        :items="statusItems"
        value-key="value"
        aria-label="Filter by publication status"
        class="w-56"
      />
      <USelect
        v-model="reviewFilter"
        :items="reviewItems"
        value-key="value"
        aria-label="Filter by review status"
        class="w-52"
      />
    </form>

    <div v-if="status === 'pending' && !data" class="mt-6 space-y-3">
      <USkeleton v-for="index in 5" :key="index" class="h-24 w-full rounded-lg" />
    </div>

    <UAlert
      v-else-if="error"
      class="mt-6"
      color="error"
      variant="soft"
      icon="i-lucide-database-zap"
      title="Vacancy data unavailable"
      description="Reload the queue or restart from the newest records."
    ><template #actions><UButton label="Retry" icon="i-lucide-refresh-cw" color="error" variant="outline" @click="refresh()" /></template></UAlert>

    <div v-else-if="data?.items.length" role="region" aria-label="Vacancy review queue" tabindex="0" class="mt-6 overflow-x-auto rounded-lg border border-default bg-elevated focus-visible:outline-2 focus-visible:outline-primary">
      <table class="w-full min-w-[880px] text-left text-sm">
        <thead class="border-b border-default bg-muted text-xs font-semibold uppercase text-muted">
          <tr>
            <th class="px-4 py-3">Vacancy</th>
            <th class="px-4 py-3">Location</th>
            <th class="px-4 py-3">Source</th>
            <th class="px-4 py-3">Review</th>
            <th class="px-4 py-3">Publication</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="vacancy in data.items" :key="vacancy.id">
            <td class="px-4 py-4">
              <p class="font-semibold text-highlighted">{{ vacancy.title }}</p>
              <p class="mt-1 text-xs text-muted">{{ vacancy.companyName }}</p>
            </td>
            <td class="px-4 py-4 text-default">
              {{ [vacancy.city, vacancy.countryCode].filter(Boolean).join(', ') }}
            </td>
            <td class="px-4 py-4">
              <a
                v-if="safeHttpUrl(vacancy.sourceUrl)"
                :href="safeHttpUrl(vacancy.sourceUrl)"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-primary hover:text-highlighted"
              >
                {{ vacancy.sourceName || 'Open source' }}
              </a>
              <span v-else class="text-muted">{{ vacancy.sourceName || 'Manual' }}</span>
            </td>
            <td class="px-4 py-4">
              <UBadge
                :label="vacancy.reviewStatus"
                :color="vacancy.reviewStatus === 'VERIFIED' ? 'success' : vacancy.reviewStatus === 'FLAGGED' ? 'error' : 'warning'"
                variant="soft"
              />
            </td>
            <td class="px-4 py-4">
              <UBadge :label="vacancy.status" color="neutral" variant="soft" />
            </td>
            <td class="px-4 py-4">
              <div class="flex justify-end gap-2">
                <UButton
                  label="Review"
                  icon="i-lucide-eye"
                  size="sm"
                  @click="activeVacancyId = vacancy.id"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UEmpty
      v-else
      class="mt-6"
      icon="i-lucide-inbox"
      title="No vacancies in this queue"
      description="Imported records will appear here."
    />
    <p v-if="data && !error" class="mt-4 text-sm text-muted">{{ data.items.length }} of {{ data.total }} records · newest updates first</p>
    <nav class="mt-4 flex flex-wrap gap-3" aria-label="Review queue pages">
      <UButton v-if="route.query.before" :to="{ query: { ...route.query, before: undefined, review: undefined }, hash: '#vacancy-admin-title' }" label="Newest records" icon="i-lucide-arrow-up" color="neutral" variant="outline" :disabled="status === 'pending'" />
      <UButton v-if="!error && data?.nextCursor" :to="{ query: { ...route.query, before: data.nextCursor, review: undefined }, hash: '#vacancy-admin-title' }" label="Older records" trailing-icon="i-lucide-arrow-right" color="neutral" variant="outline" :disabled="status === 'pending'" />
    </nav>
    <UModal v-model:open="reviewOpen" title="Review vacancy" :ui="{ content: 'max-w-3xl' }">
      <template #body><AdminVacancyReview v-if="activeVacancyId" :id="activeVacancyId" :key="activeVacancyId" @updated="reviewed" /></template>
    </UModal>
  </section>
</template>

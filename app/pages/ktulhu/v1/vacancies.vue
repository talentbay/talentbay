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
}

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  authRole: 'ADMIN',
})

const route = useRoute()
const router = useRouter()
const statusFilter = computed({
  get: () => ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(String(route.query.status)) ? String(route.query.status) as AdminVacancy['status'] : 'all',
  set: value => { void router.replace({ query: { ...route.query, status: value === 'all' ? undefined : value } }) },
})
const reviewFilter = computed({
  get: () => ['UNREVIEWED', 'VERIFIED', 'FLAGGED'].includes(String(route.query.reviewStatus)) ? String(route.query.reviewStatus) as AdminVacancy['reviewStatus'] : 'all',
  set: value => { void router.replace({ query: { ...route.query, reviewStatus: value === 'all' ? undefined : value } }) },
})
const activeVacancyId = ref<number | null>(null)
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
}))

const { data, status, error, refresh } = await useFetch<AdminVacancyResponse>(
  '/api/v1/admin/vacancies',
  { query },
)

async function reviewed() {
  activeVacancyId.value = null
  await refresh()
}
</script>

<template>
  <section aria-labelledby="vacancy-admin-title">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 id="vacancy-admin-title" class="text-3xl font-bold text-highlighted">Vacancy review</h1>
      </div>
      <UButton to="/ktulhu/v1/import" icon="i-lucide-upload" label="Import CSV" />
    </div>

    <div class="mt-6 flex flex-wrap gap-3">
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
    </div>

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
      description="Connect the PostgreSQL database before using the review queue."
    />

    <div v-else-if="data?.items.length" class="mt-6 overflow-x-auto rounded-lg border border-default bg-elevated">
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
    <p v-if="data?.items.length" class="mt-4 text-sm text-muted">{{ data.total }} records shown · newest updates first · maximum 100</p>
    <UModal v-model:open="reviewOpen" title="Review vacancy" :ui="{ content: 'max-w-3xl' }">
      <template #body><AdminVacancyReview v-if="activeVacancyId" :id="activeVacancyId" :key="activeVacancyId" @updated="reviewed" /></template>
    </UModal>
  </section>
</template>

<script setup lang="ts">
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

const statusFilter = ref<'all' | AdminVacancy['status']>('all')
const reviewFilter = ref<'all' | AdminVacancy['reviewStatus']>('all')
const activeVacancyId = ref<number | null>(null)
const actionError = ref('')

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

async function updateVacancy(
  vacancy: AdminVacancy,
  next: Pick<AdminVacancy, 'status' | 'reviewStatus'>,
) {
  actionError.value = ''
  activeVacancyId.value = vacancy.id

  try {
    await $fetch(`/api/v1/admin/vacancies/${vacancy.id}`, {
      method: 'PATCH',
      body: next,
    })
    await refresh()
  }
  catch {
    actionError.value = 'The vacancy could not be updated. Check the database and try again.'
  }
  finally {
    activeVacancyId.value = null
  }
}
</script>

<template>
  <section aria-labelledby="vacancy-admin-title">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 id="vacancy-admin-title" class="text-3xl font-bold text-highlighted">Vacancy review</h1>
        <p class="mt-2 text-sm text-muted">Imported vacancies stay private until an admin verifies and publishes them.</p>
      </div>
      <UBadge :label="`${data?.total ?? 0} records`" color="neutral" variant="soft" />
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

    <UAlert
      v-if="actionError"
      class="mt-5"
      color="error"
      variant="soft"
      title="Update failed"
      :description="actionError"
    />

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
                v-if="vacancy.sourceUrl"
                :href="vacancy.sourceUrl"
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
                  v-if="vacancy.status !== 'PUBLISHED'"
                  label="Verify & publish"
                  icon="i-lucide-circle-check"
                  size="sm"
                  :loading="activeVacancyId === vacancy.id"
                  @click="updateVacancy(vacancy, { reviewStatus: 'VERIFIED', status: 'PUBLISHED' })"
                />
                <UButton
                  v-if="vacancy.status === 'PUBLISHED'"
                  label="Archive"
                  icon="i-lucide-archive"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  :loading="activeVacancyId === vacancy.id"
                  @click="updateVacancy(vacancy, { reviewStatus: vacancy.reviewStatus, status: 'ARCHIVED' })"
                />
                <UButton
                  v-if="vacancy.reviewStatus !== 'FLAGGED'"
                  label="Flag"
                  icon="i-lucide-flag"
                  color="error"
                  variant="ghost"
                  size="sm"
                  :loading="activeVacancyId === vacancy.id"
                  @click="updateVacancy(vacancy, { reviewStatus: 'FLAGGED', status: 'DRAFT' })"
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
  </section>
</template>

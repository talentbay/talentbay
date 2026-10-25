<script setup lang="ts">
import type {
  CandidateApplicationItem,
  CandidateApplicationsResponse,
} from '#shared/types/candidates'
import { applicationStatuses } from '~/utils/application-status'

definePageMeta({ layout: 'product' })
useSeoMeta({ title: 'Your applications · TalentBay', robots: 'noindex' })
const route = useRoute()
const router = useRouter()
const { loggedIn } = useUserSession()
const { data, status, error, refresh } =
  await useAccountResource<CandidateApplicationsResponse>(
    'candidate-applications',
    '/api/v1/applications',
  )
const filter = computed({
  get: () =>
    ['active', 'closed'].includes(String(route.query.status))
      ? String(route.query.status)
      : 'all',
  set: (value) => {
    void router.replace({
      query: { ...route.query, status: value === 'all' ? undefined : value },
    })
  },
})
const counts = computed(() => {
  const items = data.value?.items || []
  const closed = items.filter(
    (item) => applicationStatuses[item.status].closed,
  ).length
  return { all: items.length, active: items.length - closed, closed }
})
const tabs = computed(() => [
  { label: `All · ${counts.value.all}`, value: 'all' },
  { label: `Active · ${counts.value.active}`, value: 'active' },
  { label: `Closed · ${counts.value.closed}`, value: 'closed' },
])
const items = computed(() =>
  (data.value?.items || []).filter(
    (item) =>
      filter.value === 'all' ||
      applicationStatuses[item.status].closed === (filter.value === 'closed'),
  ),
)
const selected = ref<CandidateApplicationItem | null>(null)
const detailsOpen = computed({
  get: () => Boolean(selected.value),
  set: (value) => {
    if (!value) selected.value = null
  },
})
watch(loggedIn, () => {
  selected.value = null
})
const date = (value: string) =>
  new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value))
</script>

<template>
  <div class="product-container py-5 lg:py-10">
    <h1 class="text-[32px] leading-10 font-bold text-highlighted">
      Your applications
    </h1>
    <p class="mt-3 text-base text-default">
      Track the current status of roles you’ve applied to.
    </p>
    <AuthSignInPanel
      v-if="!loggedIn"
      title="Keep your applications together"
    />
    <template v-else>
      <UTabs
        v-model="filter"
        :items="tabs"
        :content="false"
        class="mt-5 w-full max-w-md"
        aria-label="Application status"
      />
      <div class="mt-4 grid max-w-5xl gap-3 lg:grid-cols-2">
        <template v-if="status === 'pending' && !data">
          <USkeleton
            v-for="n in 4"
            :key="n"
            class="h-40 rounded-lg"
            aria-label="Loading applications"
          />
        </template>
        <UAlert
          v-else-if="error"
          color="error"
          title="Applications could not be loaded"
          class="lg:col-span-2"
          :actions="[{ label: 'Retry', onClick: () => refresh() }]"
        />
        <template v-else>
          <article
            v-for="item in items"
            :key="item.id"
            class="min-w-0 rounded-lg border border-default bg-elevated p-4 lg:p-5"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2
                  class="break-words text-sm font-semibold text-highlighted lg:text-base"
                >
                  {{ item.vacancy.title }}
                </h2>
                <p class="mt-1 break-words text-xs text-muted">
                  {{ item.vacancy.companyName }}
                </p>
              </div>
              <UBadge
                :color="applicationStatuses[item.status].color"
                :label="applicationStatuses[item.status].label"
                variant="soft"
                class="shrink-0"
              />
            </div>
            <p class="mt-3 text-xs text-muted">
              {{
                [item.vacancy.city, item.vacancy.countryCode]
                  .filter(Boolean)
                  .join(', ')
              }}
            </p>
            <div class="mt-2 flex items-center justify-between gap-3">
              <p class="text-xs text-muted">
                Applied
                <time :datetime="item.createdAt">
                  {{ date(item.createdAt) }}
                </time>
              </p>
              <UButton
                label="View"
                trailing-icon="i-lucide-arrow-right"
                variant="link"
                :aria-label="`View application for ${item.vacancy.title}`"
                class="min-h-11"
                @click="selected = item"
              />
            </div>
          </article>
          <UEmpty
            v-if="!items.length"
            icon="i-lucide-briefcase-business"
            :title="
              filter === 'all'
                ? 'No applications yet'
                : 'No applications in this category'
            "
            description="Find a role that fits your next move."
            :actions="[{ label: 'Browse jobs', to: '/jobs' }]"
            class="lg:col-span-2"
          />
        </template>
      </div>
      <UModal
        v-model:open="detailsOpen"
        :title="selected?.vacancy.title || 'Application'"
        description="Your submitted application and current status."
      >
        <template #body>
          <div
            v-if="selected"
            class="space-y-5"
          >
            <div>
              <p class="font-semibold text-highlighted">
                {{ selected.vacancy.companyName }}
              </p>
              <p class="mt-1 text-sm text-muted">
                Applied {{ date(selected.createdAt) }}
              </p>
            </div>
            <UBadge
              :color="applicationStatuses[selected.status].color"
              :label="applicationStatuses[selected.status].label"
              variant="soft"
            />
            <div>
              <h3 class="text-sm font-semibold text-highlighted">
                Your cover note
              </h3>
              <p class="mt-2 whitespace-pre-line break-words text-sm leading-6">
                {{ selected.coverLetter || 'No cover note added.' }}
              </p>
            </div>
            <UButton
              :to="`/jobs/${selected.vacancy.slug}`"
              label="Open vacancy"
              trailing-icon="i-lucide-arrow-up-right"
              color="neutral"
              variant="outline"
              @click="selected = null"
            />
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>

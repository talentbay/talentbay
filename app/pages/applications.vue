<script setup lang="ts">
import type {
  CandidateApplicationHistoryItem,
  CandidateApplicationsResponse,
} from '#shared/types/candidates'
import { applicationStatuses, candidateApplicationBadge } from '~/utils/application-status'
import { handlingLabels } from '~/utils/application-handling'

definePageMeta({ layout: 'product' })
useSeoMeta({ title: 'Your applications · TalentBay', robots: 'noindex' })
const route = useRoute()
const router = useRouter()
const { loggedIn, user } = useUserSession()
const query = computed(() => ({ status: typeof route.query.status === 'string' ? route.query.status : undefined, before: typeof route.query.before === 'string' ? route.query.before : undefined }))
const { data, status, error, refresh } =
  await useAccountResource<CandidateApplicationsResponse>(
    'candidate-applications',
    '/api/v1/applications',
    query,
  )
const filter = computed({
  get: () =>
    ['active', 'closed'].includes(String(route.query.status))
      ? String(route.query.status)
      : 'all',
  set: (value) => {
    void router.replace({
      query: { ...route.query, status: value === 'all' ? undefined : value, before: undefined },
    })
  },
})
const counts = computed(() => data.value?.counts || { all: 0, active: 0, closed: 0 })
const tabs = computed(() => [
  { label: `All · ${counts.value.all}`, value: 'all' },
  { label: `Active · ${counts.value.active}`, value: 'active' },
  { label: `Closed · ${counts.value.closed}`, value: 'closed' },
])
const items = computed(() => data.value?.items || [])
const selected = ref<CandidateApplicationHistoryItem | null>(null)
const owner = computed(() => loggedIn.value ? user.value?.id : undefined)
const receiptQuery = computed(() => route.query.receipt)
const unavailable = ref(false)
const heading = ref<HTMLElement | null>(null)
let receiptOpener: HTMLButtonElement | null = null
watch([owner, receiptQuery], async ([account, raw], previous, onCleanup) => {
  selected.value = null
  unavailable.value = false
  if (account !== previous?.[0] || raw !== undefined) receiptOpener = null
  if (!import.meta.client || !account || raw === undefined) return
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
    unavailable.value = true
    return
  }
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  const current = () => !controller.signal.aborted && owner.value === account && receiptQuery.value === raw
  try {
    const item = await $fetch<CandidateApplicationHistoryItem>(`/api/v1/applications/${raw}`, {
      credentials: 'same-origin', cache: 'no-store', retry: 0, signal: controller.signal,
    })
    if (!current()) return
    if (item?.id === Number(raw)) selected.value = item
    else unavailable.value = true
  } catch {
    if (current()) unavailable.value = true
  }
}, { immediate: true, flush: 'sync' })

function openReceipt(item: CandidateApplicationHistoryItem, event: MouseEvent) {
  receiptOpener = event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : null
  selected.value = item
}
function restoreReceiptFocus(event: Event) {
  event.preventDefault()
  if (selected.value || receiptQuery.value !== undefined || route.path !== '/applications') return
  if (receiptOpener?.isConnected) receiptOpener.focus({ preventScroll: true })
  else heading.value?.focus({ preventScroll: true })
  receiptOpener = null
}
onBeforeUnmount(() => { receiptOpener = null })
const receiptTitle = (item: CandidateApplicationHistoryItem) => item.vacancy?.title ?? `Application #${item.id}`
function closeReceipt(fullList = false) {
  if (receiptQuery.value !== undefined) {
    return router.replace({
      query: { ...route.query, receipt: undefined, ...(fullList ? { status: undefined, before: undefined } : {}) },
      hash: route.hash,
    })
  }
  selected.value = null
}
const detailsOpen = computed({
  get: () => Boolean(selected.value) || receiptQuery.value !== undefined,
  set: (value) => {
    if (!value) void closeReceipt()
  },
})
async function withdrawn() {
  await closeReceipt()
  await refresh()
}
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
    <h1 ref="heading" tabindex="-1" class="text-[32px] leading-10 font-bold text-highlighted">
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
                  {{ receiptTitle(item) }}
                </h2>
                <p v-if="item.vacancy" class="mt-1 break-words text-xs text-muted">
                  {{ item.vacancy.companyName }}
                </p>
              </div>
              <UBadge
                :color="candidateApplicationBadge(item).color"
                :label="candidateApplicationBadge(item).label"
                variant="soft"
                class="max-w-[55%] whitespace-normal text-right"
              />
            </div>
            <p v-if="item.status !== 'NEW' && item.handling.stage !== 'RECEIVED'" class="mt-2 text-xs text-muted">{{ handlingLabels[item.handling.stage] }}</p>
            <p v-if="item.vacancy" class="mt-3 text-xs text-muted">
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
                :aria-label="item.vacancy ? `View application for ${item.vacancy.title}` : `View application #${item.id}`"
                class="min-h-11"
                @click="openReceipt(item, $event)"
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
      <nav v-if="!error && status !== 'pending'" aria-label="Application pages" class="mt-5 flex flex-wrap gap-3">
        <UButton v-if="route.query.before" label="Newest" icon="i-lucide-arrow-up" color="neutral" variant="outline" :to="{ query: { ...route.query, before: undefined } }" />
        <UButton v-if="data?.nextCursor" label="Older applications" trailing-icon="i-lucide-arrow-right" color="neutral" variant="outline" :to="{ query: { ...route.query, before: data.nextCursor } }" />
      </nav>
      <UModal
        v-model:open="detailsOpen"
        :content="{ onCloseAutoFocus: restoreReceiptFocus }"
        :title="selected ? receiptTitle(selected) : unavailable ? 'Application unavailable' : 'Application receipt'"
        :description="unavailable ? 'This receipt could not be opened.' : selected?.status === 'NEW'
          ? 'Your application is with TalentBay. Our team handles company outreach and follow-up.'
          : 'Your application and current status.'"
        :ui="{ wrapper: 'min-w-0 pe-10', title: 'break-words', content: '[overflow-wrap:anywhere]' }"
      >
        <template #body>
          <UButton v-if="unavailable" label="View all applications" icon="i-lucide-list" color="neutral" variant="outline" @click="closeReceipt(true)" />
          <p v-else-if="!selected" role="status" class="text-sm text-muted">Loading application…</p>
          <div
            v-else
            class="space-y-5"
          >
            <div>
              <p v-if="selected.vacancy" class="font-semibold text-highlighted">
                {{ selected.vacancy.companyName }}
              </p>
              <p class="mt-1 text-sm text-muted">
                Applied {{ date(selected.createdAt) }}
              </p>
            </div>
            <CandidatesApplicationProgress :id="selected.id" :key="selected.id" />
            <UBadge
              :color="candidateApplicationBadge(selected).color"
              :label="candidateApplicationBadge(selected).label"
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
              v-if="selected.publicVacancySlug"
              :to="`/jobs/${encodeURIComponent(selected.publicVacancySlug)}`"
              label="Open vacancy"
              trailing-icon="i-lucide-arrow-up-right"
              color="neutral"
              variant="outline"
            />
            <p v-else class="text-sm text-muted">This vacancy is no longer public.</p>
            <CandidatesApplicationWithdrawal
              v-if="!applicationStatuses[selected.status].closed"
              :id="selected.id"
              :key="selected.id"
              @withdrawn="withdrawn"
            />
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>

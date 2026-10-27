<script setup lang="ts">
import type { AdminApplicationsResponse } from '#shared/types/application-review'
import { applicationStatuses } from '~/utils/application-status'
import { handlingLabels } from '~/utils/application-handling'

definePageMeta({ layout: 'admin', middleware: 'auth', authRole: 'ADMIN' })
useSeoMeta({ title: 'Application review · TalentBay', robots: 'noindex' })
const route = useRoute()
const router = useRouter()
const options = [{ label: 'All statuses', value: 'all' }, ...Object.entries(applicationStatuses).map(([value, item]) => ({ value, label: item.label }))]
const filter = computed({
  get: () => String(route.query.status || 'all'),
  set: (value) => { void router.push({ query: { ...route.query, status: value === 'all' ? undefined : value, before: undefined } }) },
})
const query = computed(() => ({ status: filter.value === 'all' ? undefined : filter.value, before: route.query.before || undefined }))
const stage = computed({ get: () => String(route.query.stage || 'all'), set: value => { void router.push({ query: { ...route.query, stage: value === 'all' ? undefined : value, before: undefined } }) } })
const mine = computed({ get: () => route.query.assignee === 'mine', set: value => { void router.push({ query: { ...route.query, assignee: value ? 'mine' : undefined, before: undefined } }) } })
const queueQuery = computed(() => ({ ...query.value, stage: stage.value === 'all' ? undefined : stage.value, assignee: mine.value ? 'mine' : undefined }))
const { data, status, error, refresh } = await useFetch<AdminApplicationsResponse>('/api/v1/admin/applications', { query: queueQuery })
const selected = ref<number | null>(null)
const open = computed({ get: () => selected.value !== null, set: (value) => { if (!value) selected.value = null } })
const date = (value: string) => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value))
</script>

<template>
  <section aria-labelledby="application-review-title">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 id="application-review-title" class="text-3xl font-bold text-highlighted">Application review</h1>
      <USelect v-model="filter" :items="options" aria-label="Filter applications by status" class="w-full sm:w-60" />
    </div>
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <USelect v-model="stage" :items="[{ label: 'All handling stages', value: 'all' }, ...Object.entries(handlingLabels).map(([value, label]) => ({ value, label }))]" aria-label="TalentBay handling stage" class="w-full sm:w-64" />
      <UCheckbox v-model="mine" label="Assigned to me" />
    </div>
    <div v-if="status === 'pending'" class="mt-6 space-y-3"><USkeleton v-for="n in 4" :key="n" class="h-20 w-full" /></div>
    <UAlert v-else-if="error" class="mt-6" title="Applications unavailable" color="error" :actions="[{ label: 'Retry', onClick: () => refresh() }]" />
    <ul v-else-if="data?.items.length" class="mt-6 divide-y divide-default border-y border-default" aria-label="Candidate applications">
      <li v-for="item in data.items" :key="item.id" class="grid min-w-0 gap-3 py-4 text-sm sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_9rem_8rem_7rem] lg:items-center">
        <p class="min-w-0 break-words font-semibold">{{ item.candidate.name }}</p>
        <div class="min-w-0 break-words"><p class="font-medium">{{ item.vacancy.title }}</p><p class="mt-1 text-xs text-muted">{{ item.vacancy.companyName }}</p></div>
        <div class="min-w-0 space-y-2"><UBadge :label="applicationStatuses[item.status].label" :color="applicationStatuses[item.status].color" /><p class="text-xs text-muted">{{ handlingLabels[item.handling.stage] }}</p></div>
        <time :datetime="item.createdAt" class="text-muted">{{ date(item.createdAt) }}</time>
        <UButton label="Review" icon="i-lucide-eye" class="min-h-11 w-fit" :aria-label="`Review ${item.candidate.name} for ${item.vacancy.title}`" @click="selected = item.id" />
      </li>
    </ul>
    <UEmpty v-else class="mt-6" icon="i-lucide-inbox" title="No applications in this queue" />
    <div class="mt-4 flex flex-wrap items-center gap-3">
      <UButton v-if="route.query.before" label="Newest" icon="i-lucide-arrow-up" color="neutral" variant="outline" :to="{ query: { ...route.query, before: undefined } }" />
      <UButton v-if="data?.nextCursor && !error && status !== 'pending'" label="Older applications" trailing-icon="i-lucide-arrow-right" color="neutral" variant="outline" :to="{ query: { ...route.query, before: data.nextCursor } }" />
    </div>
    <UModal v-model:open="open" title="Review application" :ui="{ content: 'max-w-2xl', wrapper: 'min-w-0 pe-10' }"><template #body><AdminApplicationReview v-if="selected" :id="selected" :key="selected" @changed="refresh" /></template></UModal>
  </section>
</template>

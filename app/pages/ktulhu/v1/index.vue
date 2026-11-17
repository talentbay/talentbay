<script setup lang="ts">
import { NuxtLink } from '#components'
import type { AdminDashboard } from '#shared/types/admin-dashboard'
import { handlingLabels } from '~/utils/application-handling'
import { applicationStatuses } from '~/utils/application-status'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  authRole: 'ADMIN',
})

useSeoMeta({ title: 'Operations · TalentBay', robots: 'noindex' })
const route = useRoute()
const router = useRouter()
const period = computed({
  get: () => ['7', '30', '90'].includes(String(route.query.days)) ? String(route.query.days) : '30',
  set: days => { void router.push({ query: { ...route.query, days } }) },
})
const query = computed(() => ({ days: period.value }))
const { data, status, error, refresh } = await useAccountResource<AdminDashboard>('admin-dashboard', '/api/v1/admin/dashboard', query)
const date = (value: string) => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value))
const age = (seconds: number | null) => seconds === null ? 'Not available' : seconds < 60 ? '<1 min' : seconds < 3600 ? `${Math.floor(seconds / 60)} min` : seconds < 86400 ? `${Math.floor(seconds / 3600)} h` : `${Math.floor(seconds / 86400)} d`
const workQueues = computed(() => [
  { label: 'Awaiting start', value: data.value?.work.awaitingStart, to: '/ktulhu/v1/applications?work=active&stage=RECEIVED' },
  { label: 'In progress', value: data.value?.work.inProgress, to: '/ktulhu/v1/applications?work=in-progress' },
  { label: 'Needs an operator', value: data.value?.work.needsOwner, to: '/ktulhu/v1/applications?work=needs-owner' },
  { label: 'My active work', value: data.value?.work.mine, to: '/ktulhu/v1/applications?work=active&assignee=mine' },
])

const metrics = computed(() => [
  {
    label: 'Unreviewed vacancies',
    value: data.value?.vacancies.unreviewed ?? 0,
    icon: 'i-lucide-inbox',
    to: '/ktulhu/v1/vacancies?reviewStatus=UNREVIEWED',
  },
  {
    label: 'Public vacancies',
    value: data.value?.vacancies.published ?? 0,
    icon: 'i-lucide-circle-check',
    to: '/ktulhu/v1/vacancies?status=PUBLISHED&reviewStatus=VERIFIED&publicOnly=true',
  },
  {
    label: 'Accounts',
    value: data.value?.users ?? 0,
    icon: 'i-lucide-users',
    to: '/ktulhu/v1/users',
  },
  {
    label: 'Applications',
    value: data.value?.applications ?? 0,
    icon: 'i-lucide-send',
    to: '/ktulhu/v1/applications',
  },
])
const activityItems = computed(() => data.value ? [
  { label: 'Applications received', value: data.value.activity.received, query: { receivedFrom: data.value.window.from, receivedBefore: data.value.window.before } },
  ...(['CONTACTED', 'SHARED'] as const).map(kind => ({
    label: kind === 'CONTACTED' ? 'Company contact recorded' : 'Profile handoff recorded',
    value: kind === 'CONTACTED' ? data.value!.activity.contactRecorded : data.value!.activity.handoffRecorded,
    query: { recorded: kind, recordedFrom: data.value!.window.from, recordedBefore: data.value!.window.before },
  })),
] : [])
</script>

<template>
  <section class="min-w-0" aria-labelledby="admin-overview-title">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-semibold text-primary">Operations</p>
        <h1 id="admin-overview-title" class="mt-1 text-2xl font-bold text-highlighted">
          Work overview
        </h1>
        <p v-if="data && !error" class="mt-2 text-xs text-muted">As of <time :datetime="data.asOf">{{ date(data.asOf) }} UTC</time></p>
      </div>
      <UButton icon="i-lucide-refresh-cw" label="Refresh" color="neutral" variant="outline" :loading="status === 'pending'" @click="refresh()" />
    </div>

    <div v-if="status === 'pending'" class="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <USkeleton v-for="index in 4" :key="index" class="h-32 rounded-lg" />
    </div>

    <UAlert
      v-else-if="error"
      class="mt-7"
      color="error"
      variant="soft"
      icon="i-lucide-database-zap"
      title="Operational data unavailable"
      description="The latest counts could not be loaded."
      :actions="[{ label: 'Retry', onClick: () => refresh() }]"
    />

    <template v-else-if="data">
    <section class="mt-7 border-y border-default py-5" aria-labelledby="work-queues-title">
      <h2 id="work-queues-title" class="text-lg font-semibold">Current application work</h2>
      <dl class="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div v-for="queue in workQueues" :key="queue.label" class="min-w-0">
          <dt class="break-words text-sm text-muted">{{ queue.label }}</dt>
          <dd class="mt-1 text-2xl font-semibold tabular-nums"><NuxtLink :to="queue.to" :aria-label="`${queue.label}: ${queue.value}`" class="inline-flex min-h-11 min-w-11 items-center rounded focus-visible:outline-2 focus-visible:outline-primary">{{ queue.value }}</NuxtLink></dd>
        </div>
      </dl>
    </section>

    <section class="mt-6" aria-labelledby="oldest-work-title">
      <h2 id="oldest-work-title" class="text-lg font-semibold">Oldest awaiting start</h2>
      <ul v-if="data.oldest.length" class="mt-3 divide-y divide-default">
        <li v-for="item in data.oldest" :key="item.id">
          <NuxtLink :to="{ path: '/ktulhu/v1/applications', query: { work: 'active', stage: 'RECEIVED', review: item.id } }" class="grid min-w-0 grid-cols-[minmax(0,1fr)_3rem_1rem] items-center gap-3 py-3 text-sm focus-visible:outline-2 focus-visible:outline-primary">
            <span class="min-w-0 break-words"><span class="font-medium">{{ item.title }}</span><span class="mt-1 block text-xs text-muted">#{{ item.id }} · {{ item.companyName }} · <time :datetime="item.receivedAt">{{ date(item.receivedAt) }} UTC</time></span></span>
            <span class="text-right tabular-nums">{{ age(item.ageSeconds) }}</span><UIcon name="i-lucide-chevron-right" class="size-4 shrink-0" />
          </NuxtLink>
        </li>
      </ul>
      <p v-else class="mt-3 text-sm text-muted">No applications awaiting start</p>
    </section>

    <section class="mt-6 border-t border-default pt-5" aria-labelledby="recorded-activity-title">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 id="recorded-activity-title" class="text-lg font-semibold">Recorded activity</h2>
        <USelect v-model="period" :items="[{ label: 'Last 7 days', value: '7' }, { label: 'Last 30 days', value: '30' }, { label: 'Last 90 days', value: '90' }]" aria-label="Activity period" class="w-40" />
      </div>
      <p class="mt-2 text-xs text-muted">{{ date(data.window.from) }} – {{ date(data.window.before) }} UTC</p>
      <dl class="mt-4 grid gap-4 sm:grid-cols-3">
        <div v-for="item in activityItems" :key="item.label"><dt class="text-sm text-muted">{{ item.label }}</dt><dd class="mt-1 text-xl font-semibold tabular-nums"><NuxtLink :to="{ path: '/ktulhu/v1/applications', query: item.query }" :aria-label="`${item.label}: ${item.value}`" class="inline-flex min-h-11 min-w-11 items-center rounded focus-visible:outline-2 focus-visible:outline-primary">{{ item.value }}</NuxtLink></dd></div>
      </dl>
      <dl class="mt-5 flex flex-wrap gap-8 border-t border-default pt-4 text-sm">
        <div><dt class="text-muted">Average wait to first recorded start</dt><dd class="mt-1 font-semibold">{{ age(data.firstStart.averageSeconds) }}</dd></div>
        <div><dt class="text-muted">Started applications in received cohort</dt><dd class="mt-1 font-semibold tabular-nums">{{ data.firstStart.samples }} / {{ data.activity.received }}</dd></div>
      </dl>
    </section>

    <div class="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <component
        :is="metric.to ? NuxtLink : 'div'"
        v-for="metric in metrics"
        :key="metric.label"
        :to="metric.to"
        class="min-w-0 border-t border-default py-4 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm text-muted">{{ metric.label }}</p>
            <p class="mt-2 text-2xl font-semibold text-highlighted">{{ metric.value }}</p>
          </div>
          <UIcon :name="metric.icon" class="size-5 text-primary" />
        </div>
      </component>
    </div>

    <div class="mt-8 grid gap-5 lg:grid-cols-2">
      <section class="border-t border-default pt-5" aria-labelledby="vacancy-operations-title">
        <h2 id="vacancy-operations-title" class="text-lg font-bold text-highlighted">Vacancy operations</h2>
        <UButton
          class="mt-5"
          to="/ktulhu/v1/vacancies"
          label="Open review queue"
          icon="i-lucide-arrow-right"
          trailing
        />
      </section>

      <section class="border-t border-default pt-5" aria-labelledby="data-status-title">
        <h2 id="data-status-title" class="text-lg font-bold text-highlighted">Data status</h2>
        <dl class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-muted">All vacancy records</dt>
            <dd class="mt-1 font-semibold text-highlighted">{{ data?.vacancies.total ?? 0 }}</dd>
          </div>
          <div>
            <dt class="text-muted">Organisations</dt>
            <dd class="mt-1 font-semibold text-highlighted">{{ data?.organisations ?? 0 }}</dd>
          </div>
          <div><dt class="text-muted">Stored profiles</dt><dd class="mt-1 font-semibold">{{ data.profiles }}</dd></div>
          <div><dt class="text-muted"><NuxtLink to="/ktulhu/v1/vacancies?reviewStatus=FLAGGED">Flagged vacancies</NuxtLink></dt><dd class="mt-1 font-semibold">{{ data.vacancies.flagged }}</dd></div>
        </dl>
      </section>
    </div>
    <section class="mt-8 border-t border-default pt-5" aria-labelledby="application-statuses-title">
      <h2 id="application-statuses-title" class="text-lg font-bold">Current application statuses</h2>
      <dl v-if="data.applicationStatuses.length" class="mt-4 flex flex-wrap gap-8"><div v-for="row in data.applicationStatuses" :key="row.status"><dt class="text-sm text-muted">{{ applicationStatuses[row.status].label }}</dt><dd class="mt-1 font-semibold tabular-nums"><NuxtLink :to="{ path: '/ktulhu/v1/applications', query: { status: row.status } }" :aria-label="`${applicationStatuses[row.status].label}: ${row.count}`" class="inline-flex min-h-11 min-w-11 items-center rounded focus-visible:outline-2 focus-visible:outline-primary">{{ row.count }}</NuxtLink></dd></div></dl>
      <p v-else class="mt-3 text-sm text-muted">No applications yet</p>
    </section>
    <section class="mt-8 border-t border-default pt-5" aria-labelledby="handling-stage-totals-title">
      <h2 id="handling-stage-totals-title" class="text-lg font-semibold">Current handling stages</h2>
      <dl class="mt-4 flex flex-wrap gap-8"><div v-for="row in data.handlingStages" :key="row.stage"><dt class="text-sm text-muted">{{ handlingLabels[row.stage] }}</dt><dd class="mt-1 font-semibold tabular-nums"><NuxtLink :to="{ path: '/ktulhu/v1/applications', query: { stage: row.stage } }" :aria-label="`${handlingLabels[row.stage]}: ${row.count}`" class="inline-flex min-h-11 min-w-11 items-center rounded focus-visible:outline-2 focus-visible:outline-primary">{{ row.count }}</NuxtLink></dd></div></dl>
    </section>
    </template>
  </section>
</template>

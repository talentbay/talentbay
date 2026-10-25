<script setup lang="ts">
type AdminDashboard = {
  users: number
  profiles: number
  organisations: number
  vacancies: {
    total: number
    unreviewed: number
    published: number
  }
  applications: number
  applicationStatuses: { status: string, count: number }[]
}

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  authRole: 'ADMIN',
})

const { data, status, error } = await useFetch<AdminDashboard>('/api/v1/admin/dashboard')

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
    to: '/ktulhu/v1/vacancies?status=PUBLISHED&reviewStatus=VERIFIED',
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
  },
])
</script>

<template>
  <section aria-labelledby="admin-overview-title">
    <div>
      <p class="text-sm font-semibold text-primary">Operations</p>
      <h1 id="admin-overview-title" class="mt-1 text-3xl font-bold text-highlighted">
        MVP overview
      </h1>
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
      description="Connect and migrate PostgreSQL before using the administration console."
    />

    <div v-else class="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <component
        :is="metric.to ? resolveComponent('NuxtLink') : 'div'"
        v-for="metric in metrics"
        :key="metric.label"
        :to="metric.to"
        class="rounded-lg border border-default bg-elevated p-5 transition-colors hover:border-accented"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm text-muted">{{ metric.label }}</p>
            <p class="mt-3 text-3xl font-bold text-highlighted">{{ metric.value }}</p>
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
            <dt class="text-muted">All vacancies</dt>
            <dd class="mt-1 font-semibold text-highlighted">{{ data?.vacancies.total ?? 0 }}</dd>
          </div>
          <div>
            <dt class="text-muted">Organisations</dt>
            <dd class="mt-1 font-semibold text-highlighted">{{ data?.organisations ?? 0 }}</dd>
          </div>
          <div><dt class="text-muted">Profiles</dt><dd class="mt-1 font-semibold">{{ data?.profiles ?? 0 }}</dd></div>
        </dl>
      </section>
    </div>
    <section class="mt-8 border-t border-default pt-5" aria-labelledby="application-statuses-title">
      <h2 id="application-statuses-title" class="text-lg font-bold">Application status</h2>
      <dl v-if="data?.applicationStatuses.length" class="mt-4 flex flex-wrap gap-8"><div v-for="row in data.applicationStatuses" :key="row.status"><dt class="text-sm text-muted">{{ row.status }}</dt><dd class="mt-1 font-semibold tabular-nums">{{ row.count }}</dd></div></dl>
      <p v-else class="mt-3 text-sm text-muted">No applications yet</p>
    </section>
  </section>
</template>

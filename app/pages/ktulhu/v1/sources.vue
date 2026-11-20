<script setup lang="ts">
import type { SourceRunProgress } from '#shared/types/source-import'
import type { VacancyImportPreview } from '#shared/types/vacancy-import'

definePageMeta({ layout: 'admin', middleware: 'auth', authRole: 'ADMIN' })
const { data, status, error, refresh } = await useFetch('/api/v1/admin/sources')
const selected = ref('')
const progress = ref<SourceRunProgress | null>(null)
const plan = ref<{ offset: number; preview: VacancyImportPreview } | null>(null)
const busy = ref(false)
const message = ref('')
const sources = computed(() => (data.value?.items ?? []).map(source => ({ label: source.company, value: source.key })))
const active = computed(() => progress.value?.state === 'FETCHING' || progress.value?.state === 'READY')
const excludedIds = computed(() => progress.value?.report.contactSkippedIds ?? [])

async function loadProgress() {
  if (!selected.value) return
  const response = await $fetch('/api/v1/admin/sources/progress', { query: { sourceKey: selected.value } })
  progress.value = response.progress
}
async function reload() {
  busy.value = true; message.value = ''; plan.value = null
  try { await loadProgress() }
  catch { message.value = 'Source progress could not be loaded. Try again.' }
  finally { busy.value = false }
}
watch(selected, () => { progress.value = null; void reload() })

async function run(action: 'FETCH' | 'PREVIEW' | 'IMPORT') {
  if (busy.value || !selected.value) return
  if (action !== 'FETCH' && !progress.value) return
  if (action === 'IMPORT' && (!plan.value?.preview.valid || !plan.value.preview.revision)) return
  busy.value = true; message.value = ''
  const base = { sourceKey: selected.value, runID: action === 'FETCH' ? crypto.randomUUID() : progress.value!.runID }
  const attemptedOffset = plan.value?.offset
  const body = action === 'IMPORT'
    ? { ...base, action, offset: plan.value!.offset, revision: plan.value!.preview.revision! }
    : { ...base, action }
  try {
    const response = await $fetch('/api/v1/admin/sources/run', { method: 'POST', body })
    progress.value = response.progress
    plan.value = 'preview' in response ? { offset: response.offset, preview: response.preview } : null
  }
  catch {
    plan.value = null
    message.value = 'The operation could not be confirmed. Reload progress, then preview before importing again.'
    try {
      await loadProgress()
      if (progress.value?.runID === base.runID
        && ((action === 'IMPORT' && attemptedOffset !== undefined && progress.value.nextOffset > attemptedOffset)
          || (action === 'FETCH' && progress.value.state !== 'FETCHING'))) message.value = ''
    } catch { /* Retain the last confirmed checkpoint. */ }
  }
  finally { busy.value = false }
}
</script>

<template>
  <section class="max-w-5xl" aria-labelledby="sources-title">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 id="sources-title" class="text-2xl font-bold text-highlighted">Source imports</h1>
      <UButton to="/ktulhu/v1/import" icon="i-lucide-file-spreadsheet" label="CSV import" color="neutral" variant="outline" />
    </div>
    <p v-if="status === 'pending'" class="mt-6 text-muted" role="status">Loading sources...</p>
    <UAlert v-else-if="error" class="mt-6" color="error" title="Sources unavailable">
      <template #actions><UButton icon="i-lucide-refresh-cw" label="Retry" color="error" variant="outline" @click="refresh()" /></template>
    </UAlert>
    <p v-else-if="!sources.length" class="mt-6 text-muted" role="status">No approved sources.</p>
    <template v-else>
      <div class="mt-6 flex flex-wrap items-end gap-3">
        <UFormField label="Approved source" class="min-w-0 basis-full sm:basis-0 sm:flex-1">
          <USelect v-model="selected" :items="sources" :disabled="busy" placeholder="Select a source" class="w-full" />
        </UFormField>
        <UButton icon="i-lucide-refresh-cw" label="Reload progress" color="neutral" variant="outline" :disabled="!selected || busy" @click="reload" />
        <UButton icon="i-lucide-cloud-download" label="Fetch source" :loading="busy" :disabled="!selected || active" @click="run('FETCH')" />
      </div>
      <UAlert v-if="message" role="alert" class="mt-5" color="error" title="Operation not confirmed" :description="message" />
      <section v-if="progress" class="mt-6 border-t border-default pt-5" aria-labelledby="source-progress-title">
        <h2 id="source-progress-title" class="text-lg font-semibold text-highlighted">{{ progress.state }}</h2>
        <p class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span>Scanned: {{ progress.report.recordCount }}</span>
          <span>Processed: {{ progress.nextOffset }}</span>
          <span>Excluded by contact rule: {{ excludedIds.length }}</span>
        </p>
        <details v-if="excludedIds.length" class="mt-2 text-sm">
          <summary class="cursor-pointer text-primary focus-visible:outline-2">Excluded posting IDs</summary>
          <ul class="mt-2 space-y-1">
            <li v-for="id in excludedIds" :key="id" class="break-all font-mono">
              <NuxtLink :to="{ path: '/ktulhu/v1/vacancies', query: { q: id } }" class="text-primary underline focus-visible:outline-2">{{ id }}</NuxtLink>
            </li>
          </ul>
        </details>
        <p v-if="progress.report.fetchedAt" class="mt-1 text-sm text-muted">Fetched {{ new Date(progress.report.fetchedAt).toLocaleString() }}</p>
        <p v-if="progress.state === 'READY'" class="mt-1 text-sm text-muted">Snapshot expires {{ new Date(progress.expiresAt).toLocaleString() }}</p>
        <UAlert v-if="progress.report.failure" class="mt-4" color="warning" title="Source run failed" :description="progress.report.failure" />
        <p v-if="progress.retryAfterAt" class="mt-2 text-sm text-muted">Retry after {{ new Date(progress.retryAfterAt).toLocaleString() }}</p>
        <ul v-if="progress.report.issues.length" class="mt-3 space-y-1 text-sm">
          <li v-for="issue in progress.report.issues" :key="issue.index">Record {{ issue.index + 1 }}: {{ issue.code }}</li>
        </ul>
        <dl class="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div v-for="key in (['created', 'updated', 'unchanged'] as const)" :key="key">
            <dt class="capitalize text-muted">{{ key }}</dt><dd class="mt-1 text-xl font-semibold tabular-nums">{{ progress.report[key] }}</dd>
          </div>
        </dl>
        <div class="mt-5 flex flex-wrap gap-3">
          <UButton v-if="progress.state === 'READY'" icon="i-lucide-scan-eye" label="Preview next batch" :disabled="busy" @click="run('PREVIEW')" />
          <UButton to="/ktulhu/v1/vacancies?reviewStatus=UNREVIEWED" icon="i-lucide-list-checks" label="Review queue" color="neutral" variant="outline" />
        </div>
      </section>
      <section v-if="plan" class="mt-6 border-t border-default pt-5" aria-labelledby="source-preview-title">
        <h2 id="source-preview-title" class="text-lg font-semibold text-highlighted">Batch preview</h2>
        <p class="mt-2 text-sm text-muted">{{ plan.preview.rowCount }} records · {{ plan.preview.summary.withdrawnPublished }} published records return to review</p>
        <ul v-if="plan.preview.issues.length" class="mt-3 space-y-2" role="alert">
          <li v-for="(issue, index) in plan.preview.issues" :key="index" class="text-sm">Record {{ issue.row - 1 }}: {{ issue.message }}</li>
        </ul>
        <ul class="mt-4 divide-y divide-default">
          <li v-for="row in plan.preview.rows" :key="row.row" class="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3 text-sm">
            <span class="min-w-0 break-words">{{ row.title }} · {{ row.company }}</span><span class="text-muted">{{ row.operation }}</span>
          </li>
        </ul>
        <UButton class="mt-5" icon="i-lucide-database" label="Confirm batch import" :disabled="busy || !plan.preview.valid || !plan.preview.revision" @click="run('IMPORT')" />
      </section>
    </template>
  </section>
</template>

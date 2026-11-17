<script setup lang="ts">
import { vacancyCsvByteLimit, vacancyImportRowLimit } from '#shared/types/vacancy-import'
import type { VacancyImportPreview } from '#shared/types/vacancy-import'

definePageMeta({ layout: 'admin', middleware: 'auth', authRole: 'ADMIN' })
const csv = ref('')
const filename = ref('')
const preview = ref<VacancyImportPreview | null>(null)
const busy = ref(false)
const message = ref('')
const completed = ref<number | null>(null)
let fileRead = 0

async function chooseFile(event: Event) {
  const read = ++fileRead
  csv.value = ''; preview.value = null; completed.value = null; message.value = ''
  const file = (event.target as HTMLInputElement).files?.[0]
  filename.value = file?.name ?? ''
  if (!file) return
  if (file.size > vacancyCsvByteLimit) { message.value = 'The file exceeds 512 KiB.'; return }
  busy.value = true
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer())
    if (read === fileRead) csv.value = text
  }
  catch { if (read === fileRead) message.value = 'The file could not be read as UTF-8 CSV.' }
  finally { if (read === fileRead) busy.value = false }
}

async function submit(mode: 'preview' | 'import') {
  if (busy.value || !csv.value || (mode === 'import' && !preview.value?.revision)) return
  busy.value = true; message.value = ''
  try {
    const response = await $fetch('/api/v1/admin/vacancies/file', {
      method: 'POST', body: { csv: csv.value, mode, revision: preview.value?.revision },
    })
    preview.value = response.preview
    if (response.result) completed.value = response.result.total
  }
  catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    message.value = status === 409 ? 'Content changed since validation. Validate the file again.' : 'The request could not be completed. Validate again before retrying; existing source IDs prevent duplicates.'
    preview.value = null
  }
  finally { busy.value = false }
}
</script>

<template>
  <section
aria-labelledby="import-title"
class="max-w-5xl">
    <UButton
to="/ktulhu/v1/vacancies"
label="Vacancy review"
icon="i-lucide-arrow-left"
color="neutral"
variant="ghost"
class="-ml-3 mb-4" />
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1
id="import-title"
class="text-2xl font-bold text-highlighted">
Import vacancies
</h1>
      <UButton
to="/templates/vacancies.csv"
download="talentbay-vacancies.csv"
external
icon="i-lucide-download"
label="CSV template"
color="neutral"
variant="outline" />
    </div>
    <form
class="mt-6 space-y-5"
@submit.prevent="submit('preview')">
      <UFormField
label="Vacancy file"
name="csv"
:description="`UTF-8 CSV · up to ${vacancyImportRowLimit} records · 512 KiB`">
        <input
type="file"
accept=".csv,text/csv"
aria-label="Vacancy CSV file"
:disabled="busy"
class="block w-full min-w-0 rounded-md border border-default p-3 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-2 file:font-medium file:text-default focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
@change="chooseFile">
      </UFormField>
      <UButton
type="submit"
icon="i-lucide-file-check-2"
label="Validate file"
:loading="busy"
:disabled="!csv || completed !== null" />
    </form>
    <UAlert
v-if="message"
role="alert"
class="mt-5"
color="error"
title="Import not completed"
:description="message" />
    <UAlert
v-if="completed !== null"
class="mt-6"
color="success"
title="Import complete"
:description="`${completed} records processed. New or changed content is not public until reviewed.`">
      <template #actions>
<UButton
to="/ktulhu/v1/vacancies?reviewStatus=UNREVIEWED"
label="Open review queue"
icon="i-lucide-arrow-right"
color="success"
variant="outline" />
</template>
    </UAlert>
    <section
v-if="preview"
class="mt-8 border-t border-default pt-6"
aria-labelledby="preview-title">
      <h2
id="preview-title"
class="text-lg font-semibold text-highlighted">
{{ preview.valid ? 'Import preview' : 'Validation errors' }}
</h2>
      <p class="mt-1 break-all text-sm text-muted">
{{ filename }} · {{ preview.rowCount }} records · No data written
</p>
      <div
v-if="preview.issues.length"
class="mt-4 overflow-x-auto"
role="region"
aria-label="Validation errors"
tabindex="0">
        <table class="w-full text-left text-sm"><thead>
<tr class="border-b border-default">
<th class="p-3">
Record
</th><th class="p-3">
Column
</th><th class="p-3">
Problem
</th>
</tr>
</thead><tbody>
          <tr
v-for="(issue, index) in preview.issues"
:key="index"
class="border-b border-default">
<td class="p-3">
{{ issue.row }}
</td><td class="p-3">
{{ issue.field }}
</td><td class="min-w-48 p-3">
{{ issue.message }}
</td>
</tr>
        </tbody></table>
      </div>
      <template v-if="preview.valid">
        <dl class="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div
v-for="key in (['created', 'updated', 'unchanged'] as const)"
:key="key">
<dt class="capitalize text-muted">
{{ key }}
</dt><dd class="mt-1 text-2xl font-semibold tabular-nums">
{{ preview.summary[key] }}
</dd>
</div>
        </dl>
        <UAlert
v-if="preview.summary.withdrawnPublished"
class="mt-5"
color="warning"
title="Publication impact"
:description="`${preview.summary.withdrawnPublished} published records will be withdrawn for review, including affected company records outside this file.`" />
        <div
class="mt-5 overflow-x-auto"
role="region"
aria-label="Preview records"
tabindex="0">
          <table class="w-full text-left text-sm"><thead>
<tr class="border-b border-default">
<th class="p-3">
Record
</th><th class="p-3">
Vacancy
</th><th class="p-3">
Change
</th>
</tr>
</thead><tbody>
            <tr
v-for="row in preview.rows"
:key="row.row"
class="border-b border-default">
<td class="p-3">
{{ row.row }}
</td><td class="min-w-48 p-3">
<p class="font-medium">
{{ row.title }}
</p><p class="mt-1 text-muted">
{{ row.company }}
</p>
</td><td class="p-3">
<UBadge
:label="row.operation"
color="neutral"
variant="soft" />
</td>
</tr>
          </tbody></table>
        </div>
        <UButton
class="mt-6"
icon="i-lucide-upload"
label="Confirm import"
:loading="busy"
@click="submit('import')" />
      </template>
    </section>
  </section>
</template>

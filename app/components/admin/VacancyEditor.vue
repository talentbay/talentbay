<script setup lang="ts">
import { editorialSourceName } from '#shared/types/vacancy-import'
import { editorSlug, vacancyEditorDraft, vacancyEditorItem } from '~/utils/vacancy-editor'

const props = defineProps<{ id: number | null }>()
const draft = ref(vacancyEditorDraft())
const revision = ref('')
const state = ref<'loading' | 'error' | 'legacy' | 'ready'>(props.id ? 'loading' : 'ready')
const publication = ref('DRAFT')
const consent = ref(false)
const stale = ref(false)
const busy = ref(false)
const message = ref('')
const issues = ref<{ field: string, message: string }[]>([])
const lifetime = new AbortController()
let editorialId = ''
const back = computed(() => props.id ? `/ktulhu/v1/vacancies?review=${props.id}` : '/ktulhu/v1/vacancies')
async function load() {
  if (!props.id) return
  state.value = 'loading'
  try {
    const record = await $fetch(`/api/v1/admin/vacancies/${props.id}` as const, { signal: lifetime.signal })
    if (lifetime.signal.aborted) return
    draft.value = vacancyEditorDraft(record)
    publication.value = record.vacancy.status
    revision.value = record.revision
    editorialId = record.vacancy.sourceExternalID ?? ''
    state.value = record.vacancy.sourceName && record.vacancy.sourceExternalID ? 'ready' : 'legacy'
    stale.value = false; consent.value = false; issues.value = []; message.value = ''
  } catch { if (!lifetime.signal.aborted) state.value = 'error' }
}
onMounted(load)
onBeforeUnmount(() => lifetime.abort())

async function save() {
  if (state.value !== 'ready' || busy.value || stale.value || (publication.value === 'PUBLISHED' && !consent.value)) return
  busy.value = true; message.value = ''; issues.value = []
  try {
    if (!editorialId && !draft.value.external) editorialId = crypto.randomUUID()
    const result = await $fetch('/api/v1/admin/vacancies/editor', {
      method: 'POST', signal: lifetime.signal, body: {
        target: props.id ? { mode: 'edit', id: props.id, revision: revision.value } : { mode: 'create' },
        item: vacancyEditorItem(draft.value, editorialId),
      },
    })
    if (!lifetime.signal.aborted) await navigateTo(`/ktulhu/v1/vacancies?review=${result.id}`)
  } catch (error) {
    if (lifetime.signal.aborted) return
    const response = error as { statusCode?: number, data?: { data?: { issues?: { field: string, message: string }[] } } }
    issues.value = response.data?.data?.issues ?? []
    stale.value = response.statusCode === 409 && !!props.id
    message.value = stale.value ? 'This vacancy changed. Reload it before applying your correction.'
      : response.statusCode === 409 ? 'This vacancy URL or source ID already exists. Find the original in Vacancy review, or use a different key for a new role.'
        : response.statusCode === 422 ? 'Check the fields below and the company status.'
          : response.statusCode === 403 ? 'This account or environment cannot save this vacancy.'
            : 'The save could not be confirmed. Check the queue before retrying.'
  } finally { busy.value = false }
}
</script>

<template>
  <section class="max-w-3xl" aria-labelledby="editor-title">
    <UButton :to="back" icon="i-lucide-arrow-left" label="Vacancy review" variant="ghost" color="neutral" class="-ml-3 mb-4" />
    <h1 id="editor-title" class="text-2xl font-bold text-highlighted">{{ id ? 'Edit vacancy' : 'Create vacancy' }}</h1>
    <p v-if="state === 'loading'" role="status" class="mt-6">Loading vacancy…</p>
    <UAlert v-else-if="state === 'error'" title="Vacancy unavailable" color="error" class="mt-6"><template #actions><UButton label="Retry" @click="load" /></template></UAlert>
    <UAlert v-else-if="state === 'legacy'" title="Source identity missing" description="This older record needs a verified source key before its content can be edited. It can still be reviewed or archived." class="mt-6" color="warning" />
    <form v-else class="mt-6 space-y-6" @submit.prevent="save">
      <fieldset :disabled="busy || stale" class="grid min-w-0 gap-4 sm:grid-cols-2">
        <legend class="mb-3 text-lg font-semibold">Vacancy</legend>
        <UFormField label="Job title" required><UInput v-model="draft.title" required maxlength="180" class="w-full" /></UFormField>
        <UFormField label="Vacancy URL key"><UInput v-model="draft.slug" :placeholder="editorSlug(draft.title)" :readonly="!!id" maxlength="120" class="w-full" /></UFormField>
        <UFormField label="Company name" required><UInput v-model="draft.company" required :readonly="!!id" maxlength="160" class="w-full" /></UFormField>
        <UFormField label="Company key"><UInput v-model="draft.companySlug" :placeholder="editorSlug(draft.company)" :readonly="!!id" maxlength="120" class="w-full" /></UFormField>
        <UFormField label="Country code" required><UInput v-model="draft.country" required placeholder="GB" maxlength="2" class="w-full" /></UFormField>
        <UFormField label="City"><UInput v-model="draft.city" maxlength="120" class="w-full" /></UFormField>
        <UFormField label="Employment"><USelect v-model="draft.employment" :items="[{label:'Full-time',value:'FULL_TIME'},{label:'Part-time',value:'PART_TIME'},{label:'Contract',value:'CONTRACT'},{label:'Internship',value:'INTERNSHIP'}]" class="w-full" /></UFormField>
        <UFormField label="Workplace"><USelect v-model="draft.workplace" :items="[{label:'On-site',value:'ONSITE'},{label:'Hybrid',value:'HYBRID'},{label:'Remote',value:'REMOTE'}]" class="w-full" /></UFormField>
        <UFormField label="Summary" class="sm:col-span-2"><UInput v-model="draft.summary" maxlength="500" class="w-full" /></UFormField>
        <UFormField label="Job description" required class="sm:col-span-2"><UTextarea v-model="draft.description" required minlength="20" maxlength="50000" :rows="5" class="w-full" /></UFormField>
        <UFormField label="Seniority"><UInput v-model="draft.seniority" maxlength="80" class="w-full" /></UFormField>
        <UFormField label="Skills"><UInputTags v-model="draft.skills" class="w-full" /></UFormField>
      </fieldset>
      <fieldset :disabled="busy || stale" class="grid min-w-0 gap-4 border-t border-default pt-3 sm:grid-cols-2">
        <legend class="pr-3 text-lg font-semibold">Compensation and support</legend>
        <UCheckbox v-model="draft.relocation" label="Relocation offered" /><UCheckbox v-model="draft.visa" label="Visa sponsorship" />
        <UCheckbox v-model="draft.hasSalary" label="Salary disclosed" class="sm:col-span-2" />
        <template v-if="draft.hasSalary">
          <UFormField label="Minimum salary" required><UInput v-model="draft.min" type="number" min="0" required class="w-full" /></UFormField>
          <UFormField label="Maximum salary" required><UInput v-model="draft.max" type="number" min="1" required class="w-full" /></UFormField>
          <UFormField label="Currency" required><UInput v-model="draft.currency" required maxlength="3" placeholder="GBP" class="w-full" /></UFormField>
          <UFormField label="Salary period"><USelect v-model="draft.period" :items="[{label:'Year',value:'YEAR'},{label:'Month',value:'MONTH'},{label:'Hour',value:'HOUR'}]" class="w-full" /></UFormField>
        </template>
      </fieldset>
      <fieldset :disabled="busy || stale" class="grid min-w-0 gap-4 border-t border-default pt-3 sm:grid-cols-2">
        <legend class="pr-3 text-lg font-semibold">Source</legend>
        <UCheckbox v-if="!id" v-model="draft.external" label="External source" class="sm:col-span-2" />
        <template v-if="draft.external">
          <UFormField label="Source name" required><UInput v-model="draft.sourceName" required :readonly="!!id" class="w-full" /></UFormField>
          <UFormField label="Source vacancy ID" required><UInput v-model="draft.externalId" required :readonly="!!id" class="w-full" /></UFormField>
        </template>
        <p v-else class="text-sm text-muted sm:col-span-2">{{ editorialSourceName }}</p>
        <UFormField label="Original posting URL" :required="draft.external"><UInput v-model="draft.url" type="url" :required="draft.external" class="w-full" /></UFormField>
        <UFormField label="Company website"><UInput v-model="draft.website" type="url" :readonly="!!id" class="w-full" /></UFormField>
        <UFormField label="Source publication time"><UInput v-model="draft.sourcePublishedAt" placeholder="2026-11-20T09:00:00Z" class="w-full" /></UFormField>
      </fieldset>
      <UCheckbox v-if="publication === 'PUBLISHED'" v-model="consent" label="I understand that changing this published vacancy takes it offline for review." />
      <p v-if="publication === 'ARCHIVED'" class="text-sm text-muted">Saving changes will keep this vacancy archived.</p>
      <div v-if="message" role="alert" class="space-y-2 text-sm">
        <p class="font-semibold text-error">{{ message }}</p>
        <ul v-if="issues.length" class="list-inside list-disc"><li v-for="(issue, i) in issues" :key="i">{{ issue.field }}: {{ issue.message }}</li></ul>
        <UButton v-if="stale" type="button" label="Reload latest vacancy" variant="outline" @click="load" />
      </div>
      <UButton type="submit" icon="i-lucide-save" :label="id ? 'Save changes' : 'Create draft'" :loading="busy" :disabled="stale || (publication === 'PUBLISHED' && !consent)" />
    </form>
  </section>
</template>

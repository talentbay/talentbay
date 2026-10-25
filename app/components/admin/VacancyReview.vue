<script setup lang="ts">
import { safeHttpUrl } from '~/utils/safe-http-url'

const props = defineProps<{ id: number }>()
const emit = defineEmits<{ updated: [] }>()
const { data, status, error, refresh } = await useFetch(() => `/api/v1/admin/vacancies/${props.id}` as const)
const busy = ref(false)
const failure = ref('')
const stale = ref(false)
const checked = ref(false)
watch(data, () => { checked.value = false; stale.value = false })

async function review(action: 'publish' | 'archive' | 'flag') {
  if (!data.value || busy.value || stale.value || (action === 'publish' && !checked.value)) return
  busy.value = true; failure.value = ''
  try {
    await $fetch(`/api/v1/admin/vacancies/${props.id}`, {
      method: 'PATCH', body: {
        revision: data.value.revision,
        status: action === 'publish' ? 'PUBLISHED' : action === 'archive' || data.value.vacancy.status === 'ARCHIVED' ? 'ARCHIVED' : 'DRAFT',
        reviewStatus: action === 'publish' ? 'VERIFIED' : action === 'flag' ? 'FLAGGED' : data.value.vacancy.reviewStatus,
      },
    })
    emit('updated')
  }
  catch (error) {
    stale.value = (error as { statusCode?: number }).statusCode === 409
    failure.value = stale.value ? 'This record changed. Reload it and review the new content.' : 'The update failed. An archived company cannot publish vacancies. Reload before retrying.'
  }
  finally { busy.value = false }
}
</script>

<template>
  <div
v-if="status === 'pending' && !data"
class="space-y-4">
<USkeleton class="h-8 w-2/3" /><USkeleton class="h-52 w-full" />
</div>
  <UAlert
v-else-if="error"
color="error"
title="Vacancy unavailable">
<template #actions>
<UButton
label="Retry"
icon="i-lucide-refresh-cw"
color="neutral"
@click="refresh()" />
</template>
</UAlert>
  <div
v-else-if="data"
class="space-y-6 [overflow-wrap:anywhere]">
    <div>
<h2 class="text-xl font-bold">
{{ data.vacancy.title }}
</h2><p class="mt-1 text-muted">
{{ data.company.name }} · {{ data.company.status }}
</p><div class="mt-3 flex gap-2">
<UBadge
:label="data.vacancy.status"
color="neutral" /><UBadge
:label="data.vacancy.reviewStatus"
color="neutral" />
</div>
</div>
    <dl class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
      <div>
<dt class="text-muted">
Location
</dt><dd>
{{ [data.vacancy.city, data.vacancy.countryCode].filter(Boolean).join(', ') }}
</dd>
</div>
      <div>
<dt class="text-muted">
Employment
</dt><dd>
{{ data.vacancy.employmentType }} · {{ data.vacancy.workplaceType }} · {{ data.vacancy.seniority || 'Not specified' }}
</dd>
</div>
      <div>
<dt class="text-muted">
Salary
</dt><dd>
{{ data.vacancy.salaryMin !== null ? `${data.vacancy.salaryMin}–${data.vacancy.salaryMax} ${data.vacancy.salaryCurrency} / ${data.vacancy.salaryPeriod}` : 'Not disclosed' }}
</dd>
</div>
      <div>
<dt class="text-muted">
Support
</dt><dd>
Relocation: {{ data.vacancy.relocationOffered ? 'Yes' : 'No' }} · Visa: {{ data.vacancy.visaSponsorship ? 'Yes' : 'No' }}
</dd>
</div>
      <div>
<dt class="text-muted">
Skills
</dt><dd>
{{ data.vacancy.skills.join(', ') || 'Not specified' }}
</dd>
</div>
      <div>
<dt class="text-muted">
Company website
</dt><dd>
<a
v-if="safeHttpUrl(data.company.websiteUrl)"
:href="safeHttpUrl(data.company.websiteUrl)!"
target="_blank"
rel="noopener noreferrer"
class="text-primary underline">{{ data.company.websiteUrl }}</a><span v-else>Not provided</span>
</dd>
</div>
      <div class="sm:col-span-2">
<dt class="text-muted">
Source
</dt><dd>
{{ data.vacancy.sourceName || 'Manual' }} · {{ data.vacancy.sourceExternalID || 'No external ID' }}<a
v-if="safeHttpUrl(data.vacancy.sourceUrl)"
:href="safeHttpUrl(data.vacancy.sourceUrl)!"
target="_blank"
rel="noopener noreferrer"
class="mt-1 block text-primary underline">{{ data.vacancy.sourceUrl }}</a>
</dd>
</div>
    </dl>
    <section v-if="data.vacancy.summary">
<h3 class="font-semibold">
Summary
</h3><p class="mt-2 whitespace-pre-wrap text-sm leading-6">
{{ data.vacancy.summary }}
</p>
</section>
    <section>
<h3 class="font-semibold">
Description
</h3><p class="mt-2 whitespace-pre-wrap text-sm leading-6">
{{ data.vacancy.description }}
</p>
</section>
    <UAlert
v-if="failure"
role="alert"
color="error"
title="Update not completed"
:description="failure">
<template #actions>
<UButton
label="Reload record"
icon="i-lucide-refresh-cw"
color="neutral"
:disabled="busy"
@click="refresh()" />
</template>
</UAlert>
    <div class="border-t border-default pt-5">
      <UCheckbox
v-model="checked"
label="I checked the content, source and permission to publish."
:disabled="busy || stale" />
      <div class="mt-4 flex flex-wrap gap-3">
        <UButton
v-if="data.vacancy.status !== 'PUBLISHED'"
label="Verify & publish"
icon="i-lucide-circle-check"
:disabled="!checked || stale || data.company.status === 'ARCHIVED'"
:loading="busy"
@click="review('publish')" />
        <UButton
label="Archive"
icon="i-lucide-archive"
color="neutral"
variant="outline"
:disabled="stale || data.vacancy.status === 'ARCHIVED'"
:loading="busy"
@click="review('archive')" />
        <UButton
label="Flag"
icon="i-lucide-flag"
color="error"
variant="outline"
:disabled="stale"
:loading="busy"
@click="review('flag')" />
      </div>
    </div>
  </div>
</template>

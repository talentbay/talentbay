<script setup lang="ts">
import type { AdminApplicationDetail } from '#shared/types/application-review'
import { applicationStatuses } from '~/utils/application-status'
import { safeHttpUrl } from '~/utils/safe-http-url'

const props = defineProps<{ id: number }>()
const emit = defineEmits<{ changed: [] }>()
const { data, status, error, refresh } = await useFetch<AdminApplicationDetail>(() => `/api/v1/admin/applications/${props.id}`)
const details = computed(() => {
  const profile = data.value?.candidate.profile
  return [
    ['Headline', profile?.headline], ['Location', [profile?.city, profile?.countryCode].filter(Boolean).join(', ')],
    ['Email', data.value?.candidate.user.email], ['Phone', profile?.phone], ['Telegram', profile?.telegram],
  ]
})
async function changed() { await refresh(); emit('changed') }
</script>

<template>
  <div v-if="status === 'pending' && !data" class="space-y-4"><USkeleton class="h-8 w-2/3" /><USkeleton class="h-52 w-full" /></div>
  <UAlert v-else-if="error" title="Application unavailable" color="error" :actions="[{ label: 'Retry', onClick: () => refresh() }]" />
  <div v-else-if="data" class="space-y-6 [overflow-wrap:anywhere]">
    <div>
      <h2 class="text-xl font-bold text-highlighted">{{ data.candidate.user.name }}</h2>
      <p class="mt-1 text-sm text-muted">{{ data.vacancy.title }} · {{ data.vacancy.companyName }}</p>
      <UBadge class="mt-3" :label="applicationStatuses[data.status].label" :color="applicationStatuses[data.status].color" />
    </div>
    <UAlert v-if="!data.submissionSnapshot" title="Legacy application" description="Only the current profile is available. Submission-time details and permission to share were not recorded. Do not forward this record." color="warning" variant="soft" />
    <section :aria-label="data.submissionSnapshot ? 'Submitted candidate profile' : 'Current candidate profile'">
      <h3 class="font-semibold">{{ data.submissionSnapshot ? 'Profile at submission' : 'Current profile' }}</h3>
      <dl class="mt-3 grid gap-4 text-sm sm:grid-cols-2">
        <div v-for="[label, value] in details" :key="label || ''"><dt class="text-muted">{{ label }}</dt><dd>{{ value || 'Not provided' }}</dd></div>
      </dl>
      <p v-if="data.candidate.profile?.about" class="mt-4 whitespace-pre-wrap text-sm leading-6">{{ data.candidate.profile.about }}</p>
      <div class="mt-3 flex flex-wrap gap-4 text-sm">
        <a v-if="safeHttpUrl(data.candidate.profile?.githubUrl)" :href="safeHttpUrl(data.candidate.profile?.githubUrl)" target="_blank" rel="noopener noreferrer" class="text-primary underline">GitHub</a>
        <a v-if="safeHttpUrl(data.candidate.profile?.linkedinUrl)" :href="safeHttpUrl(data.candidate.profile?.linkedinUrl)" target="_blank" rel="noopener noreferrer" class="text-primary underline">LinkedIn</a>
      </div>
    </section>
    <section><h3 class="font-semibold">Cover note</h3><p class="mt-2 whitespace-pre-wrap text-sm leading-6">{{ data.coverLetter || 'No cover note added.' }}</p></section>
    <AdminApplicationHandling :application="data" @changed="changed" />
    <div class="flex flex-wrap gap-3 border-t border-default pt-4">
      <UButton :to="`/jobs/${data.vacancy.slug}`" label="Open vacancy" color="neutral" variant="outline" trailing-icon="i-lucide-arrow-up-right" />
    </div>
  </div>
</template>

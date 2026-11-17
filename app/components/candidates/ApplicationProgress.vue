<script setup lang="ts">
import type { CandidateApplicationProgress } from '#shared/types/candidates'
import { handlingLabels, handlingEventLabels, handlingCloseLabels, handlingCorrectionLabels, handlingTime } from '~/utils/application-handling'

const props = defineProps<{ id: number }>()
const { user } = useUserSession()
const { data, status, error, refresh } = await useAccountResource<CandidateApplicationProgress>(`application-progress-${props.id}`, `/api/v1/applications/${props.id}/progress`)
const events = ref<CandidateApplicationProgress['events']>([])
const cursor = ref<number | null>(null), loading = ref(false), moreError = ref(false)
watch(data, value => { events.value = value?.events || []; cursor.value = value?.nextCursor ?? null }, { immediate: true })
async function older() {
  if (!cursor.value || loading.value) return
  const owner = user.value?.id
  loading.value = true; moreError.value = false
  try {
    const next = await $fetch<CandidateApplicationProgress>(`/api/v1/applications/${props.id}/progress`, { query: { before: cursor.value } })
    if (user.value?.id !== owner) return
    events.value.push(...next.events.filter(event => !events.value.some(existing => existing.revision === event.revision)))
    cursor.value = next.nextCursor
  } catch { if (user.value?.id === owner) moreError.value = true } finally { loading.value = false }
}
</script>

<template>
  <section aria-label="Application progress" class="space-y-4 border-y border-default py-4">
    <USkeleton v-if="status === 'pending' && !data" class="h-24 w-full" />
    <UAlert v-else-if="error" title="Progress unavailable" color="error" :actions="[{ label: 'Retry', onClick: () => refresh() }]" />
    <template v-else-if="data">
      <h3 class="text-sm font-semibold">{{ handlingLabels[data.stage] }}</h3>
      <p v-if="data.handoffRecorded" class="text-xs text-muted">TalentBay recorded a manual handoff to the company. This does not confirm delivery, employer reading or a hiring decision. Withdrawal cannot recall information already shared outside TalentBay.</p>
      <p v-if="data.legacy" class="text-xs text-muted">Earlier activity was not recorded. This history only shows events actually saved by TalentBay.</p>
      <ol class="space-y-4">
        <li v-for="event in events" :key="event.revision" class="text-sm">
          <p class="font-medium">{{ handlingEventLabels[event.kind] }}</p>
          <p v-if="event.corrected" class="mt-1 text-xs font-medium text-muted">A later correction marks this entry as inaccurate.</p>
          <time :datetime="event.createdAt" class="text-xs text-muted">Recorded {{ handlingTime(event.createdAt) }}</time>
          <p v-if="!event.corrected && event.occurredAt && ['SHARED', 'CONTACTED'].includes(event.kind)" class="text-xs text-muted">Action time: {{ handlingTime(event.occurredAt) }}</p>
          <p v-if="!event.corrected && event.closeReason" class="mt-1 text-xs text-muted">{{ handlingCloseLabels[event.closeReason] }}</p>
          <p v-if="event.correctedRevision && event.correctionReason" class="mt-1 text-xs text-muted">Update {{ event.correctedRevision }}: {{ handlingCorrectionLabels[event.correctionReason] }}. Corrections do not confirm recall of information shared outside TalentBay.</p>
        </li>
      </ol>
      <p v-if="!events.length" class="text-sm text-muted">No handling events recorded yet.</p>
      <UAlert v-if="moreError" title="Earlier activity could not be loaded" color="error" />
      <UButton v-if="cursor" label="Earlier activity" trailing-icon="i-lucide-chevron-down" color="neutral" variant="outline" :loading="loading" @click="older" />
    </template>
  </section>
</template>

<script setup lang="ts">
import type { CandidateApplicationProgress } from '#shared/types/candidates'
import { handlingLabels, handlingEventLabels, handlingCloseLabels, handlingCorrectionLabels, handlingTime } from '~/utils/application-handling'

const props = defineProps<{ id: number }>()
const { user, loggedIn } = useUserSession()
const { data, status, error, refresh } = await useAccountResource<CandidateApplicationProgress>(`application-progress-${props.id}`, `/api/v1/applications/${props.id}/progress`)
const owner = computed(() => loggedIn.value ? user.value?.id : undefined)
const firstPage = computed(() => owner.value && status.value === 'success' && data.value?.id === props.id ? data.value : null)
const events = ref<CandidateApplicationProgress['events']>([])
const cursor = ref<number | null>(null), moreError = ref(false)
const pendingOlder = shallowRef<AbortController>()
watch([firstPage, owner, () => props.id], ([page]) => {
  pendingOlder.value?.abort()
  pendingOlder.value = undefined
  moreError.value = false
  events.value = page?.events || []
  cursor.value = page?.nextCursor ?? null
}, { immediate: true, flush: 'sync' })
onScopeDispose(() => pendingOlder.value?.abort())
async function older() {
  if (!firstPage.value || cursor.value === null || pendingOlder.value) return
  const { id, revision } = firstPage.value
  const request = new AbortController()
  pendingOlder.value = request
  moreError.value = false
  try {
    const next = await $fetch<CandidateApplicationProgress>(`/api/v1/applications/${id}/progress`, { query: { before: cursor.value }, signal: request.signal })
    if (request.signal.aborted) return
    if (next.id !== id || next.revision !== revision) {
      await refresh()
      return
    }
    events.value = events.value.concat(next.events.filter(event => !events.value.some(existing => existing.revision === event.revision)))
    cursor.value = next.nextCursor
  } catch {
    if (!request.signal.aborted) moreError.value = true
  } finally {
    if (pendingOlder.value === request) pendingOlder.value = undefined
  }
}
</script>

<template>
  <section aria-label="Application progress" class="space-y-4 border-y border-default py-4">
    <USkeleton v-if="status === 'pending'" class="h-24 w-full" />
    <UAlert v-else-if="error" title="Progress unavailable" color="error" :actions="[{ label: 'Retry', onClick: () => refresh() }]" />
    <template v-else-if="firstPage">
      <h3 class="text-sm font-semibold">{{ handlingLabels[firstPage.stage] }}</h3>
      <p v-if="firstPage.handoffCorrected" class="text-xs text-muted">The handoff record was corrected. We cannot confirm whether the company received your application or whether any shared copy was recalled.</p>
      <p v-else-if="firstPage.handoffRecorded" class="text-xs text-muted">TalentBay recorded a manual handoff to the company. This does not confirm delivery, employer reading or a hiring decision. Withdrawal cannot recall information already shared outside TalentBay.</p>
      <p v-if="firstPage.legacy" class="text-xs text-muted">Earlier activity was not recorded. This history only shows events actually saved by TalentBay.</p>
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
      <UButton v-if="cursor" label="Earlier activity" trailing-icon="i-lucide-chevron-down" color="neutral" variant="outline" :loading="Boolean(pendingOlder)" @click="older" />
    </template>
  </section>
</template>

<script setup lang="ts">
import type { AdminApplicationDetail } from '#shared/types/application-review'
import type { ApplicationPackage } from '#shared/types/application-handling'
import type { ApplicationCommand } from '#shared/schemas/application-command'
import { handlingLabels, handlingCloseLabels, handlingCorrectionLabels, handlingEventLabels, handlingTime } from '~/utils/application-handling'

const props = defineProps<{ application: AdminApplicationDetail }>()
const emit = defineEmits<{ changed: [] }>()
const { user } = useUserSession()
const busy = ref(false), error = ref(''), reloadRequired = ref(false)
const action = ref('START'), note = ref(''), reference = ref('')
const channel = ref<'EMAIL' | 'PHONE' | 'PLATFORM' | 'OTHER'>('EMAIL')
const occurredAt = ref(''), assigneeID = ref<number | undefined>(), reason = ref<keyof typeof handlingCloseLabels | undefined>('CONTACT_UNAVAILABLE')
const acknowledged = ref(false), copied = ref(false)
const packet = ref<ApplicationPackage | null>(null)
let retry: { signature: string; command: ApplicationCommand } | null = null
let detailGeneration = 0
const { data: operators, error: operatorsError, refresh: refreshOperators } = await useFetch('/api/v1/admin/users', { query: { role: 'ADMIN' } })
const operatorItems = computed(() => operators.value?.items.map(operator => ({ label: operator.name, value: operator.id })) || [])
const active = computed(() => !['WITHDRAWN', 'REJECTED'].includes(props.application.status) && props.application.handling.stage !== 'CLOSED')
const mine = computed(() => Boolean(user.value?.id) && props.application.handling.assignedUserID === user.value?.id)
const canShare = computed(() => active.value && mine.value && ['CONTACTED', 'FOLLOW_UP'].includes(props.application.handling.stage)
  && Boolean(props.application.submissionSnapshot) && !props.application.handoffRecorded && !props.application.handoffCorrected)
const closeReasons = computed(() => Object.entries(handlingCloseLabels)
  .filter(([value]) => value !== 'NO_RESPONSE' || props.application.hasUncorrectedContact)
  .map(([value, label]) => ({ value, label })))
const canClose = computed(() => closeReasons.value.some(option => option.value === reason.value))
watch(canClose, allowed => { if (!allowed) reason.value = undefined }, { flush: 'sync' })
const actions = computed(() => {
  const stage = props.application.handling.stage
  const options: { label: string; value: string }[] = []
  if (stage === 'RECEIVED') options.push({ label: 'Start handling', value: 'START' })
  if (['IN_PROGRESS', 'CONTACTED'].includes(stage)) options.push({ label: 'Record company contact', value: 'CONTACT' })
  if (canShare.value) options.push({ label: 'Record completed handoff', value: 'SHARE' })
  if (['CONTACTED', 'SHARED', 'FOLLOW_UP'].includes(stage)) options.push({ label: 'Record follow-up', value: 'FOLLOW_UP' })
  options.push({ label: 'Close handling', value: 'CLOSE' })
  return options
})
function clearPackage() {
  packet.value = null
  acknowledged.value = false
  copied.value = false
}
function requireReload(message: string) {
  reloadRequired.value = true
  clearPackage()
  retry = null
  error.value = message
}
watch([() => props.application, () => props.application.id, () => user.value?.id, () => props.application.handling.revision, canShare], ([detail, id, operator], [previous, previousID, previousOperator]) => {
  detailGeneration++
  busy.value = false
  clearPackage()
  retry = null
  if (id !== previousID || operator !== previousOperator) {
    note.value = ''; reference.value = ''; assigneeID.value = undefined
  }
  if (operator !== previousOperator) requireReload('Your operator access changed. Reload the record before continuing.')
  else if (detail !== previous) {
    // A successful detail reload replaces the object even if its revision is unchanged.
    reloadRequired.value = false
    error.value = ''
  }
}, { flush: 'sync' })
onScopeDispose(() => { detailGeneration++ })
watch(actions, options => {
  if (!options.some(option => option.value === action.value)) action.value = options[0]!.value
}, { immediate: true })
watch(() => props.application.handling.stage, (stage, previous) => {
  if (previous === 'CLOSED' && stage !== 'CLOSED') action.value = actions.value[0]?.value || 'START'
})
const localNow = () => {
  const date = new Date()
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, -1)
}
watch(action, () => { occurredAt.value = localNow(); if (!reloadRequired.value) error.value = ''; acknowledged.value = false }, { immediate: true })
const packetText = computed(() => {
  if (!packet.value) return ''
  const { snapshot, coverLetter } = packet.value
  const profile = snapshot.candidate.profile
  return [
    `TalentBay application for ${snapshot.vacancy.title} at ${snapshot.recipient.name}`,
    `Candidate: ${snapshot.candidate.name}`, profile.headline,
    [profile.city, profile.countryCode].filter(Boolean).join(', '),
    snapshot.candidate.email, profile.phone, profile.telegram, profile.githubUrl, profile.linkedinUrl,
    profile.about, coverLetter ? `Cover note: ${coverLetter}` : null,
  ].filter(Boolean).join('\n\n')
})
function failed(cause: unknown) {
  const failure = cause as { statusCode?: number; response?: { status: number } } | null
  const status = failure?.statusCode ?? failure?.response?.status
  if (status === 409) return requireReload('The application changed or this action is not allowed. Reload the record before continuing. Your note is still here.')
  if (status === 403 || status === 401) return requireReload('Your operator access changed. Reload the record before continuing.')
  if (status === 404) return requireReload('This application is no longer available. Reload the record before continuing.')
  if (status && status >= 400 && status < 500 && status !== 408) {
    retry = null
    error.value = 'This action was not accepted. Review your draft or reload the record.'
  } else error.value = 'Could not confirm this action. Your draft is still here; retry to check the result or reload the record.'
}
async function submit(specific?: ApplicationCommand['action'], target?: number) {
  if (busy.value || reloadRequired.value || !user.value?.id || !active.value) return
  const selected = specific || action.value
  let command: ApplicationCommand
  const base = { expectedRevision: props.application.handling.revision, commandKey: '', privateNote: note.value || undefined }
  if (selected === 'ASSIGN') {
    if (!target) return
    command = { ...base, action: 'ASSIGN', assigneeID: target }
  } else if (selected === 'CONTACT' || selected === 'SHARE') {
    if (!reference.value.trim() || !occurredAt.value || (selected === 'SHARE' && (!canShare.value || !packet.value || !acknowledged.value))) return
    const time = new Date(occurredAt.value)
    if (!Number.isFinite(time.getTime())) return
    const contact = { ...base, channel: channel.value, occurredAt: time.toISOString(), reference: reference.value }
    command = selected === 'SHARE' ? { ...contact, action: 'SHARE', confirmCompleted: true } : { ...contact, action: 'CONTACT' }
  } else if (selected === 'CLOSE') {
    if (!reason.value || !canClose.value) return
    command = { ...base, action: 'CLOSE', reason: reason.value }
  } else if (selected === 'START' || selected === 'FOLLOW_UP') command = { ...base, action: selected }
  else return
  const signature = JSON.stringify(command)
  if (retry?.signature !== signature) retry = { signature, command: { ...command, commandKey: crypto.randomUUID() } }
  const generation = detailGeneration
  busy.value = true; error.value = ''
  try {
    await $fetch(`/api/v1/admin/applications/${props.application.id}/handling`, { method: 'POST', retry: 0, body: retry!.command })
    if (generation !== detailGeneration) return
    retry = null; note.value = ''; reference.value = ''; clearPackage()
    reloadRequired.value = true
    emit('changed')
  } catch (cause) { if (generation === detailGeneration) failed(cause) } finally { if (generation === detailGeneration) busy.value = false }
}
async function prepare() {
  if (busy.value || reloadRequired.value || !canShare.value) return
  const generation = detailGeneration
  const { id, handling: { revision } } = props.application
  clearPackage()
  busy.value = true; error.value = ''
  try {
    const prepared = await $fetch<ApplicationPackage>(`/api/v1/admin/applications/${id}/package`, { retry: 0 })
    if (generation !== detailGeneration) return
    if (prepared?.revision !== revision || prepared.applicationID !== id) return requireReload('The package does not match this application revision. Reload the record before continuing.')
    packet.value = prepared
  } catch (cause) { if (generation === detailGeneration) failed(cause) } finally { if (generation === detailGeneration) busy.value = false }
}
async function copy() {
  if (busy.value || reloadRequired.value || !canShare.value || !packet.value) return
  const current = packet.value
  try { await navigator.clipboard.writeText(packetText.value); if (packet.value === current) copied.value = true }
  catch { if (packet.value === current) error.value = 'Clipboard is unavailable. Select the package text to copy it manually.' }
}
</script>

<template>
  <section aria-label="TalentBay handling" class="space-y-4 border-t border-default pt-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="font-semibold">TalentBay handling</h3><UBadge :label="handlingLabels[application.handling.stage]" color="neutral" variant="soft" />
    </div>
    <p class="text-sm text-muted">{{ application.handling.assignedUserID ? (mine ? 'Assigned to you' : `Assigned to operator #${application.handling.assignedUserID}`) : 'No operator assigned' }}</p>
    <template v-if="active && !reloadRequired">
      <div class="flex flex-wrap items-end gap-3">
        <UButton v-if="!mine" label="Take application" icon="i-lucide-user-check" :loading="busy" @click="submit('ASSIGN', user?.id)" />
        <UFormField label="Transfer to operator" class="min-w-0 flex-1"><USelect v-model="assigneeID" :items="operatorItems" placeholder="Select operator" :disabled="busy" class="w-full" /></UFormField>
        <UButton label="Assign" color="neutral" variant="outline" :disabled="busy || !assigneeID || assigneeID === application.handling.assignedUserID" @click="submit('ASSIGN', assigneeID)" />
      </div>
      <UAlert v-if="operatorsError" title="Operator list unavailable" color="warning" :actions="[{ label: 'Retry', onClick: () => refreshOperators() }]" />
      <form v-if="mine" class="space-y-4" @submit.prevent="submit()">
        <UFormField label="Next action"><USelect v-model="action" :items="actions" :disabled="busy" class="w-full" /></UFormField>
        <div v-if="action === 'CONTACT' || action === 'SHARE'" class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Channel"><USelect v-model="channel" :items="['EMAIL', 'PHONE', 'PLATFORM', 'OTHER']" class="w-full" :disabled="busy" /></UFormField>
          <UFormField label="Actual contact time"><UInput v-model="occurredAt" type="datetime-local" step="0.001" required class="w-full" :disabled="busy" /></UFormField>
          <UFormField label="Private reference" class="sm:col-span-2"><UInput v-model="reference" required maxlength="300" class="w-full" :disabled="busy" /></UFormField>
        </div>
        <UFormField v-if="action === 'CLOSE'" label="Reason"><USelect v-model="reason" :items="closeReasons" placeholder="Select a reason" class="w-full" :disabled="busy" /></UFormField>
        <template v-if="action === 'SHARE' && canShare">
          <UButton label="Prepare candidate package" icon="i-lucide-file-user" variant="outline" :loading="busy" @click="prepare" />
          <div v-if="packet" class="space-y-3">
            <p class="text-sm font-medium">For {{ packet.snapshot.recipient.name }} · {{ packet.snapshot.vacancy.title }}</p>
            <UTextarea :model-value="packetText" readonly :rows="8" aria-label="Candidate package" class="w-full" />
            <UButton :label="copied ? 'Copied' : 'Copy package'" icon="i-lucide-copy" color="neutral" variant="outline" :disabled="busy" @click="copy" />
            <p class="text-xs text-muted">Preparing or copying records no handoff. Recheck the application before sharing outside TalentBay.</p>
            <UCheckbox v-model="acknowledged" :label="`I have already shared this exact package with ${packet.snapshot.recipient.name} for this role through the recorded channel.`" :disabled="busy" />
          </div>
        </template>
        <UFormField label="Private operator note" hint="Optional"><UTextarea v-model="note" :rows="3" maxlength="2000" :disabled="busy" class="w-full" /></UFormField>
        <UButton type="submit" :label="action === 'SHARE' ? 'Record completed handoff' : 'Record action'" icon="i-lucide-check" :loading="busy" :disabled="busy || (action === 'CLOSE' && !canClose) || (action === 'SHARE' && (!canShare || !packet || !acknowledged))" />
      </form>
    </template>
    <UAlert v-if="error" title="Action not confirmed" :description="error" color="error" :actions="[{ label: 'Reload record', onClick: () => emit('changed') }]" />
    <p v-if="application.handoffCorrected" class="text-sm text-muted">The handoff record was corrected. Delivery and recall are unconfirmed. Do not share the candidate package again.</p>
    <p v-else-if="application.handoffRecorded" class="text-sm text-muted">A manual handoff was recorded. This is not proof of employer delivery, reading or a hiring decision.</p>
    <AdminApplicationRecovery v-if="!reloadRequired" :application="application" @changed="emit('changed')" />
    <section aria-label="Operator journal" class="space-y-3 border-t border-default pt-4">
      <h4 class="text-sm font-semibold">Operator journal</h4>
      <p v-if="!application.events.length" class="text-sm text-muted">No handling history was recorded for this legacy application.</p>
      <ol class="space-y-4">
        <li v-for="event in application.events" :key="event.id" class="text-sm">
          <p class="font-medium">{{ handlingEventLabels[event.kind] }}</p>
          <time :datetime="event.createdAt" class="text-xs text-muted">{{ handlingTime(event.createdAt) }} · operator/user #{{ event.actorUserID || 'removed' }} · revision {{ event.revision }}</time>
          <p v-if="event.data.reference" class="mt-1 whitespace-pre-wrap break-words">{{ event.data.channel }} · {{ event.data.reference }}</p>
          <p v-if="event.data.closeReason">{{ handlingCloseLabels[event.data.closeReason] }}</p>
          <p v-if="event.data.correctedRevision && event.data.correctionReason">Revision {{ event.data.correctedRevision }}: {{ handlingCorrectionLabels[event.data.correctionReason] }}</p>
          <p v-if="event.privateNote" class="mt-1 whitespace-pre-wrap break-words text-muted">{{ event.privateNote }}</p>
        </li>
      </ol>
      <p v-if="application.eventsTruncated" class="text-xs text-muted">Showing the latest 50 recorded events.</p>
    </section>
  </section>
</template>

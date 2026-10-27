<script setup lang="ts">
import type { AdminApplicationDetail } from '#shared/types/application-review'
import type { ApplicationCommand } from '#shared/schemas/application-command'
import type { HandlingCorrectionReason } from '#shared/types/application-handling'
import { handlingCorrectionLabels } from '~/utils/application-handling'

const props = defineProps<{ application: AdminApplicationDetail }>()
const emit = defineEmits<{ changed: [] }>()
const { user } = useUserSession()
const mode = ref<'CORRECT' | 'REOPEN'>('CORRECT')
const target = ref<number | undefined>()
const reason = ref<HandlingCorrectionReason>('RECORDED_IN_ERROR')
const note = ref(''), error = ref(''), busy = ref(false), forbidden = ref(false)
let retry: { signature: string; command: ApplicationCommand } | null = null
const reopenable = computed(() => props.application.canReopenHandling === true)
const valid = computed(() => note.value.trim().length >= 5 && !forbidden.value && (mode.value === 'REOPEN' ? reopenable.value : Number.isInteger(target.value) && target.value! > 0 && target.value! <= props.application.handling.revision))
watch(reopenable, (value) => { if (!value) mode.value = 'CORRECT' })
watch([() => user.value?.id, () => props.application.id], () => { mode.value = 'CORRECT'; note.value = ''; target.value = undefined; error.value = ''; forbidden.value = false; busy.value = false; retry = null })
async function submit() {
  if (busy.value || !valid.value) return
  const base = { expectedRevision: props.application.handling.revision, commandKey: '', privateNote: note.value.trim() }
  const command: ApplicationCommand = mode.value === 'REOPEN' ? { ...base, action: 'REOPEN' }
    : { ...base, action: 'CORRECT', targetRevision: target.value!, reason: reason.value }
  const signature = JSON.stringify(command)
  if (retry?.signature !== signature) retry = { signature, command: { ...command, commandKey: crypto.randomUUID() } }
  const ownerID = user.value?.id, applicationID = props.application.id
  const current = () => user.value?.id === ownerID && props.application.id === applicationID
  busy.value = true; error.value = ''
  try {
    await $fetch(`/api/v1/admin/applications/${applicationID}/handling`, { method: 'POST', body: retry!.command, timeout: 15_000 })
    if (!current()) return
    retry = null; note.value = ''; target.value = undefined; emit('changed')
  }
  catch (cause) {
    if (!current()) return
    const status = (cause as { statusCode?: number }).statusCode
    forbidden.value = status === 403
    error.value = status === 409 ? 'The record changed or this recovery is not allowed. Reload before continuing. Your note is retained.'
      : status === 403 ? 'Your operator access changed.' : 'Could not confirm recovery. Your draft is retained; retry to check the result.'
  }
  finally { if (current()) busy.value = false }
}
</script>

<template>
  <details class="border-t border-default pt-3 text-sm">
    <summary class="cursor-pointer py-2 font-semibold text-primary focus-visible:outline-2 focus-visible:outline-primary">Correct or reopen handling</summary>
    <form class="mt-3 space-y-4" aria-label="Application recovery" @submit.prevent="submit">
      <p v-if="application.handling.stage === 'CLOSED' && !reopenable" class="text-xs text-muted">Reopening is unavailable after withdrawal, rejection or a candidate-requested closure.</p>
      <UFormField label="Recovery action">
        <USelect v-model="mode" :items="[{ value: 'CORRECT', label: 'Correct an operator entry' }, ...(reopenable ? [{ value: 'REOPEN', label: 'Reopen and take application' }] : [])]" :disabled="busy || forbidden" class="w-full" />
      </UFormField>
      <template v-if="mode === 'CORRECT'">
        <UFormField label="Entry revision"><UInput v-model.number="target" type="number" min="1" :max="application.handling.revision" step="1" required :disabled="busy || forbidden" class="w-full" /></UFormField>
        <UFormField label="Correction reason"><USelect v-model="reason" :items="Object.entries(handlingCorrectionLabels).map(([value, label]) => ({ value, label }))" :disabled="busy || forbidden" class="w-full" /></UFormField>
        <p class="text-xs text-muted">The original entry stays in history and is marked inaccurate. A correction does not recall a profile or allow another handoff.</p>
      </template>
      <p v-else class="text-xs text-muted">TalentBay review resumes and this application is assigned to you. Candidate withdrawal and employer rejection cannot be reopened.</p>
      <UFormField label="Private recovery note"><UTextarea v-model="note" required minlength="5" maxlength="2000" :rows="3" :disabled="busy || forbidden" class="w-full" /></UFormField>
      <UButton type="submit" :label="mode === 'CORRECT' ? 'Record correction' : 'Reopen and take application'" icon="i-lucide-rotate-ccw" :disabled="!valid || busy" :loading="busy" />
      <UAlert v-if="error" title="Recovery not confirmed" :description="error" color="error" :actions="[{ label: 'Reload record', onClick: () => emit('changed') }]" />
    </form>
  </details>
</template>

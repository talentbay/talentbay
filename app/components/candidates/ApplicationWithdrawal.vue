<script setup lang="ts">
const props = defineProps<{ id: number }>()
const emit = defineEmits<{ withdrawn: [] }>()
const { user } = useUserSession()
const confirming = ref(false)
const busy = ref(false)
const failure = ref('')
async function withdraw() {
  if (busy.value || !confirming.value) return
  busy.value = true; failure.value = ''
  const owner = user.value?.id
  try {
    await $fetch(`/api/v1/applications/${props.id}/withdraw`, { method: 'POST', body: {} })
    if (user.value?.id === owner) emit('withdrawn')
  } catch {
    if (user.value?.id === owner) failure.value = 'Withdrawal failed. Your application has not been confirmed as withdrawn. Please retry.'
  } finally { busy.value = false }
}
</script>

<template>
  <div class="border-t border-default pt-4">
    <UButton v-if="!confirming" label="Withdraw application" icon="i-lucide-circle-minus" color="neutral" variant="outline" class="min-h-11" @click="confirming = true" />
    <template v-else>
      <p class="text-sm font-semibold">Withdraw this application?</p>
      <p class="mt-1 text-sm text-muted">It will be closed in TalentBay. You cannot submit a second application to this role.</p>
      <UAlert v-if="failure" class="mt-3" title="Not withdrawn" :description="failure" color="error" />
      <div class="mt-3 flex flex-wrap gap-3">
        <UButton label="Keep application" color="neutral" variant="outline" class="min-h-11" :disabled="busy" @click="confirming = false" />
        <UButton label="Confirm withdrawal" color="error" class="min-h-11" :loading="busy" @click="withdraw" />
      </div>
    </template>
  </div>
</template>

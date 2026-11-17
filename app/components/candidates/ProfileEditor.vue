<script setup lang="ts">
import type {
  CandidateProfileData,
  CandidateProfileResponse,
} from '#shared/types/candidates'
import { emptyCandidateProfile } from '~/utils/candidate-profile'

const props = defineProps<{ profile: CandidateProfileData | null }>()
const emit = defineEmits<{ saved: [value: CandidateProfileResponse] }>()
const open = defineModel<boolean>('open', { default: false })
const form = reactive(emptyCandidateProfile())
const saving = ref(false)
const error = ref('')
const dirty = ref(false)
watch(open, (value) => {
  if (!value || dirty.value) return
  for (const key of Object.keys(form) as Array<keyof typeof form>) form[key] = props.profile?.[key] ?? ''
})
async function save() {
  if (saving.value) return
  saving.value = true
  error.value = ''
  try {
    const result = await $fetch<CandidateProfileResponse>('/api/v1/profile', {
      method: 'PUT',
      body: form,
    })
    dirty.value = false
    emit('saved', result)
    open.value = false
  } catch {
    error.value =
      'Your profile could not be saved. Check the fields and try again. Your draft is still here.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Edit profile"
    description="Your professional details and recruitment contact information."
    :dismissible="!saving"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <form
        id="candidate-profile-form"
        class="grid gap-5 sm:grid-cols-2"
        @input="dirty = true"
        @submit.prevent="save"
      >
        <UFormField
          label="Professional headline"
          class="sm:col-span-2"
        >
          <UInput
            v-model="form.headline"
            maxlength="160"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Country code"
          hint="Two letters, e.g. DE"
        >
          <UInput
            v-model="form.countryCode"
            maxlength="2"
            pattern="[a-zA-Z]{2}"
            class="w-full"
          />
        </UFormField>
        <UFormField label="City">
          <UInput
            v-model="form.city"
            maxlength="120"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Phone">
          <UInput
            v-model="form.phone"
            type="tel"
            maxlength="40"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Telegram">
          <UInput
            v-model="form.telegram"
            maxlength="80"
            placeholder="@username"
            class="w-full"
          />
        </UFormField>
        <UFormField label="GitHub URL">
          <UInput
            v-model="form.githubUrl"
            type="url"
            maxlength="2048"
            placeholder="https://github.com/…"
            class="w-full"
          />
        </UFormField>
        <UFormField label="LinkedIn URL">
          <UInput
            v-model="form.linkedinUrl"
            type="url"
            maxlength="2048"
            placeholder="https://linkedin.com/in/…"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="About"
          class="sm:col-span-2"
        >
          <UTextarea
            v-model="form.about"
            :rows="5"
            maxlength="5000"
            class="w-full"
          />
        </UFormField>
        <UAlert
          v-if="error"
          color="error"
          title="Save failed"
          :description="error"
          class="sm:col-span-2"
        />
      </form>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          :disabled="saving"
          @click="open = false"
        />
        <UButton
          form="candidate-profile-form"
          type="submit"
          icon="i-lucide-check"
          label="Save profile"
          :loading="saving"
          :disabled="saving"
        />
      </div>
    </template>
  </UModal>
</template>

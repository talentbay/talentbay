<script setup lang="ts">
import type { CandidateApplicationsResponse } from '#shared/types/candidates'
import type { VacancyListItem } from '#shared/types/vacancies'

const props = defineProps<{ vacancy: VacancyListItem }>()
const { loggedIn, user } = useUserSession()
const { initialized, isSaved, toggleSaved } = useSavedVacancies()
const { haptic } = useProductHost()
const toast = useToast()
const open = ref(false)
const draft = ref('')
const submitting = ref(false)
const error = ref('')
const outcome = ref<'submitted' | 'already' | null>(null)
const {
  data: applications,
  status,
  refresh,
} = await useAccountResource<CandidateApplicationsResponse>(
  'candidate-applications',
  '/api/v1/applications',
)
const applied = computed(() =>
  Boolean(
    outcome.value ||
    applications.value?.items.some(
      (item) => item.vacancy.slug === props.vacancy.slug,
    ),
  ),
)
watch(
  () => user.value?.id,
  () => {
    draft.value = ''
    error.value = ''
    outcome.value = null
    open.value = false
  },
)
function save() {
  if (!toggleSaved(props.vacancy.slug))
    toast.add({
      title: 'Your shortlist is full',
      description: 'Remove a saved role before adding another.',
      color: 'warning',
    })
  else haptic()
}
async function submit() {
  if (
    submitting.value ||
    !loggedIn.value ||
    applied.value ||
    props.vacancy.source.status === 'DEMO'
  )
    return
  submitting.value = true
  error.value = ''
  const owner = user.value?.id
  try {
    await $fetch(`/api/v1/vacancies/${props.vacancy.id}/applications`, {
      method: 'POST',
      body: { coverLetter: draft.value || null },
    })
    if (user.value?.id !== owner) return
    outcome.value = 'submitted'
    draft.value = ''
    open.value = false
    haptic('success')
    await refresh()
  } catch (cause) {
    if (user.value?.id !== owner) return
    if ((cause as { statusCode?: number }).statusCode === 409) {
      outcome.value = 'already'
      open.value = false
      await refresh()
    } else
      error.value =
        'Your application could not be submitted. Your cover note is still here. Try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <UAlert
      v-if="outcome"
      :title="
        outcome === 'submitted'
          ? 'Application submitted'
          : 'You have already applied to this vacancy'
      "
      color="success"
      variant="soft"
      class="mb-4"
      :actions="[{ label: 'Applications', to: '/applications' }]"
    />
    <div
      class="candidate-bottom-nav fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-default bg-elevated px-4 pt-3 lg:static lg:z-auto lg:flex-col lg:border-0 lg:bg-transparent lg:p-0"
    >
      <VacanciesSaveButton
        :saved="isSaved(vacancy.slug)"
        :disabled="!initialized"
        with-label
        class="lg:order-2"
        @click="save"
      />
      <UButton
        v-if="vacancy.source.status === 'DEMO'"
        label="Preview only"
        icon="i-lucide-flask-conical"
        disabled
        class="min-h-11 flex-1 justify-center"
      />
      <UButton
        v-else-if="applied"
        label="View application"
        to="/applications"
        icon="i-lucide-check"
        class="min-h-11 flex-1 justify-center"
      />
      <UButton
        v-else
        :label="loggedIn ? 'Apply' : 'Sign in to apply'"
        :disabled="!initialized || (loggedIn && status === 'pending')"
        class="min-h-11 flex-1 justify-center"
        @click="open = true"
      />
    </div>
    <UModal
      v-model:open="open"
      :title="`Apply for ${vacancy.title}`"
      :description="vacancy.company.name"
      :dismissible="!submitting"
    >
      <template #body>
        <AuthSignInPanel v-if="!loggedIn" />
        <form
          v-else
          id="vacancy-application"
          class="space-y-5"
          @submit.prevent="submit"
        >
          <p class="text-sm text-muted">
            Your current TalentBay profile will be associated with this
            application.
          </p>
          <NuxtLink
            to="/profile"
            class="text-sm text-primary underline"
          >
            Review your profile
          </NuxtLink>
          <UFormField
            label="Cover note"
            hint="Optional"
          >
            <UTextarea
              v-model="draft"
              :rows="6"
              maxlength="5000"
              class="w-full"
            />
          </UFormField>
          <UAlert
            v-if="error"
            color="error"
            title="Application failed"
            :description="error"
          />
        </form>
      </template>
      <template
        v-if="loggedIn"
        #footer
      >
        <div class="flex w-full justify-end gap-3">
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            :disabled="submitting"
            @click="open = false"
          />
          <UButton
            type="submit"
            form="vacancy-application"
            label="Submit application"
            icon="i-lucide-send"
            :loading="submitting"
            :disabled="submitting || applied"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

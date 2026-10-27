<script setup lang="ts">
import type { CandidateApplicationsResponse, CandidateProfileResponse } from '#shared/types/candidates'
import { applicationDisclosureVersion } from '#shared/types/application-handling'
import { applicationContacts, canSubmitApplication } from '#shared/utils/application-contact'
import { safeHttpUrl } from '~/utils/safe-http-url'
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
const acknowledged = ref(false)
const { data: profile, status: profileStatus, error: profileError, refresh: refreshProfile } = await useAccountResource<CandidateProfileResponse>('candidate-profile', '/api/v1/profile')
const contacts = computed(() => applicationContacts(profile.value))
const profileReady = computed(() => canSubmitApplication(profile.value))
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
    acknowledged.value = false
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
    || !acknowledged.value || !profileReady.value
  )
    return
  submitting.value = true
  error.value = ''
  const owner = user.value?.id
  try {
    await $fetch(`/api/v1/vacancies/${props.vacancy.id}/applications`, {
      method: 'POST',
      body: { coverLetter: draft.value || null, disclosureVersion: applicationDisclosureVersion, shareAcknowledged: true },
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
    } else {
      error.value = (cause as { statusCode?: number }).statusCode === 422
        ? 'Add a valid email, phone number or Telegram username to your profile, then try again. Your cover note is still here.'
        : 'Your application could not be submitted. Your cover note is still here. Try again.'
      await refreshProfile()
    }
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
          ? 'Application received by TalentBay'
          : 'You have already applied to this vacancy'
      "
      :description="outcome === 'submitted'
        ? 'Our team will contact the company about your candidacy and follow up on next steps.'
        : undefined"
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
      :ui="{ wrapper: 'min-w-0 pe-10', title: 'break-words', content: '[overflow-wrap:anywhere]' }"
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
            Your current profile and cover note go to the TalentBay team, not
            directly to the employer. We contact the company to propose your candidacy.
          </p>
          <USkeleton v-if="profileStatus === 'pending'" class="h-24 w-full" />
          <UAlert v-else-if="profileError" title="Profile unavailable" color="error" :actions="[{ label: 'Retry', onClick: () => refreshProfile() }]" />
          <div v-else-if="profileReady" class="space-y-2 border-y border-default py-4 text-sm" aria-label="Application profile preview">
            <p class="font-semibold text-highlighted">{{ profile?.user.name }}</p>
            <p v-if="profile?.profile?.headline">{{ profile.profile.headline }}</p>
            <p v-for="(contact, kind) in contacts" :key="kind" :class="{ hidden: !contact }" class="break-words">{{ contact }}</p>
            <p class="text-muted">Your profile, professional links and cover note will be saved with this application for {{ vacancy.company.name }}.</p>
            <details>
              <summary class="cursor-pointer text-primary">Included profile details</summary>
              <div class="mt-2 space-y-2 whitespace-pre-wrap break-words">
                <p>{{ [profile?.profile?.city, profile?.profile?.countryCode].filter(Boolean).join(', ') || 'Location not provided' }}</p>
                <p>{{ profile?.profile?.about || 'No introduction added' }}</p>
                <a v-if="safeHttpUrl(profile?.profile?.githubUrl)" :href="safeHttpUrl(profile?.profile?.githubUrl)" target="_blank" rel="noopener noreferrer" class="block underline">{{ profile?.profile?.githubUrl }}</a>
                <a v-if="safeHttpUrl(profile?.profile?.linkedinUrl)" :href="safeHttpUrl(profile?.profile?.linkedinUrl)" target="_blank" rel="noopener noreferrer" class="block underline">{{ profile?.profile?.linkedinUrl }}</a>
              </div>
            </details>
          </div>
          <UAlert v-else title="Add a contact to your profile" description="Save your profile with an email, phone number or Telegram username so our team can reach you." color="warning" variant="soft" />
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
          <UCheckbox v-model="acknowledged" :label="`I ask TalentBay to contact ${vacancy.company.name } and share this application with them for this role.`" :disabled="!profileReady" />
          <p class="text-xs text-muted">You can withdraw in Applications. Withdrawal stops further handling here; it cannot recall information already shared outside TalentBay. No employer response or placement is guaranteed.</p>
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
            :disabled="submitting || applied || !acknowledged || !profileReady || profileStatus === 'pending' || Boolean(profileError)"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

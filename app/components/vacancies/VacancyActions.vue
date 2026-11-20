<script setup lang="ts">
import type { CandidateProfileResponse } from '#shared/types/candidates'
import { applicationDisclosureVersion } from '#shared/types/application-handling'
import { applicationContacts, canSubmitApplication } from '#shared/utils/application-contact'
import { safeHttpUrl } from '~/utils/safe-http-url'
import type { VacancyListItem } from '#shared/types/vacancies'

const props = defineProps<{ vacancy: VacancyListItem; refreshing?: boolean }>()
const emit = defineEmits<{ refresh: [] }>()
const { loggedIn, user, fetch: refreshSession } = useUserSession()
const { initialized, isSaved, toggleSaved } = useSavedVacancies()
const { haptic } = useProductHost()
const toast = useToast()
const open = ref(false)
const draft = ref('')
const submitting = ref(false)
const error = ref('')
const outcome = ref<'submitted' | 'already' | null>(null)
const submittedId = ref<number | null>(null)
const acknowledged = ref(false)
const contextChanged = ref(false)
const editingProfile = ref(false)
const sessionExpired = ref(false)
let profileEditOwner: number | undefined
let sessionGeneration = 0
const { data: profile, status: profileStatus, error: profileError, refresh: refreshProfile } = await useAccountResource<CandidateProfileResponse>('candidate-profile', '/api/v1/profile')
const contacts = computed(() => applicationContacts(profile.value))
const profileReady = computed(() => canSubmitApplication(profile.value))
const {
  data: applications,
  status,
  refresh,
} = await useAccountResource<{ application: { id: number } | null }>(
  `vacancy-application-${props.vacancy.id}`,
  `/api/v1/vacancies/${props.vacancy.id}/application`,
)
const applied = computed(() =>
  Boolean(
    outcome.value ||
    applications.value?.application,
  ),
)
const receiptId = computed(() => submittedId.value ?? applications.value?.application?.id)
const applicationLink = computed(() => receiptId.value
  ? { path: '/applications', query: { receipt: String(receiptId.value) } }
  : '/applications')
watch(
  () => loggedIn.value ? user.value?.id : undefined,
  () => {
    sessionGeneration++
    submitting.value = false
    draft.value = ''
    error.value = ''
    outcome.value = null
    submittedId.value = null
    acknowledged.value = false
    contextChanged.value = false
    editingProfile.value = false
    profileEditOwner = undefined
    sessionExpired.value = false
    open.value = false
  },
  { flush: 'sync' },
)
watch(() => props.vacancy.applicationContext, () => {
  acknowledged.value = false
  contextChanged.value = false
  error.value = ''
})
watch(() => props.refreshing, (value, previous) => {
  if (value || !previous) return
  acknowledged.value = false
  contextChanged.value = false
  error.value = ''
})
function editProfile() {
  if (!loggedIn.value || submitting.value) return
  profileEditOwner = user.value?.id
  acknowledged.value = false
  open.value = false
  editingProfile.value = true
}
watch(editingProfile, async (value, previous) => {
  if (value || !previous) return
  const owner = profileEditOwner
  await nextTick()
  if (owner && user.value?.id === owner) open.value = true
})
async function profileSaved(value: CandidateProfileResponse) {
  if (value.user.id !== user.value?.id) return
  profile.value = value
  await refreshProfile()
}
async function signedIn() {
  await nextTick()
  if (loggedIn.value) open.value = true
}
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
    || !props.vacancy.applicationContext || contextChanged.value || props.refreshing
  )
    return
  submitting.value = true
  error.value = ''
  const owner = user.value?.id
  const generation = sessionGeneration
  const current = () => generation === sessionGeneration && owner === user.value?.id
  try {
    const receipt = await $fetch<{ id: number }>(`/api/v1/vacancies/${props.vacancy.id}/applications`, {
      method: 'POST',
      body: { coverLetter: draft.value || null, disclosureVersion: applicationDisclosureVersion, shareAcknowledged: true, expectedContext: props.vacancy.applicationContext },
    })
    if (!current()) return
    submittedId.value = receipt?.id ?? null
    outcome.value = 'submitted'
    draft.value = ''
    open.value = false
    haptic('success')
    await refresh()
  } catch (cause) {
    if (!current()) return
    if ((cause as { statusCode?: number }).statusCode === 401) {
      await refreshSession()
      await nextTick()
      if (!loggedIn.value) {
        sessionExpired.value = true
        open.value = true
      } else if (current()) error.value = 'Your session could not be confirmed. Try submitting again.'
      return
    }
    if ([404, 412].includes((cause as { statusCode?: number }).statusCode ?? 0)) {
      acknowledged.value = false
      contextChanged.value = true
      error.value = 'This listing changed. Reload it and review the company and role again before applying. Your cover note is still here.'
    } else if ((cause as { statusCode?: number }).statusCode === 409) {
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
    if (current()) submitting.value = false
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
        ? `Track our team's review in Applications. You'll see when we record contact with the company.`
        : undefined"
      color="success"
      variant="soft"
      class="mb-4"
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
        :label="receiptId ? 'View application' : 'Applications'"
        :to="applicationLink"
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
        <AuthSignInPanel
          v-if="!loggedIn"
          :vacancy-id="vacancy.id"
          :application-context="vacancy.applicationContext"
          :title="sessionExpired ? 'Sign in again to apply' : undefined"
          :description="sessionExpired ? 'Your session ended. For privacy, the previous cover note was cleared. You are still on the same vacancy.' : undefined"
          @completed="signedIn"
        />
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
          <UButton label="Review your profile" icon="i-lucide-user-pen" color="neutral" variant="outline" :disabled="submitting || profileStatus === 'pending'" @click="editProfile" />
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
          <UCheckbox :key="vacancy.applicationContext" v-model="acknowledged" :label="`I ask TalentBay to contact ${vacancy.company.name } and share this application with them for this role.`" :disabled="!profileReady || contextChanged || refreshing" />
          <p class="text-xs text-muted">You can withdraw in Applications. Withdrawal stops further handling here; it cannot recall information already shared outside TalentBay. No employer response or placement is guaranteed.</p>
          <UAlert
            v-if="error"
            color="error"
            title="Application failed"
            :description="error"
          />
          <UButton v-if="contextChanged" label="Reload listing" icon="i-lucide-refresh-cw" variant="outline" :loading="refreshing" @click="emit('refresh')" />
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
            :disabled="submitting || applied || !acknowledged || !profileReady || profileStatus === 'pending' || Boolean(profileError) || contextChanged || refreshing || !vacancy.applicationContext"
          />
        </div>
      </template>
    </UModal>
    <CandidatesProfileEditor
      v-if="loggedIn"
      :key="user?.id"
      v-model:open="editingProfile"
      :profile="profile?.profile || null"
      @saved="profileSaved"
    />
  </div>
</template>

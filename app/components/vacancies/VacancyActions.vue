<script setup lang="ts">
import type { ReviewedCandidateProfileResponse } from '#shared/types/candidates'
import { applicationDisclosureVersion } from '#shared/types/application-handling'
import { applicationContacts, canSubmitApplication } from '#shared/utils/application-contact'
import { safeHttpUrl } from '~/utils/safe-http-url'
import { readApplicationSession } from '~/utils/read-application-session'
import type { VacancyListItem } from '#shared/types/vacancies'

const props = defineProps<{ vacancy: VacancyListItem; reloadListing: (signal: AbortSignal) => Promise<'updated' | 'unavailable' | 'retry'> }>()
const { loggedIn, user, session } = useUserSession()
const { initialized, isSaved, toggleSaved } = useSavedVacancies()
const { haptic } = useProductHost()
const toast = useToast()
const open = ref(false)
const draft = ref('')
useKeyboardForm()
const submitting = ref(false)
const error = ref('')
const unconfirmedReceipt = 'We could not confirm receipt. Your cover note is still here. Check Applications before trying again.'
const outcome = ref<'submitted' | 'already' | null>(null)
const submittedId = ref<number | null>(null)
const consent = shallowRef<{ owner: number; vacancyId: number; expectedContext: string; expectedCandidateContext: string } | null>(null)
const listingState = ref<'ready' | 'changed' | 'unavailable'>('ready')
const refreshing = ref(false)
const editingProfile = ref(false)
const sessionExpired = ref(false)
let profileEditOwner: number | undefined
let sessionGeneration = 0
let reloadRequest: AbortController | undefined
let profileRequest: AbortController | undefined
onBeforeUnmount(() => {
  sessionGeneration++
  reloadRequest?.abort()
  profileRequest?.abort()
})
const ownerId = computed(() => loggedIn.value ? user.value?.id : undefined)
const loadedProfile = shallowRef<ReviewedCandidateProfileResponse | null>(null)
const profileStatus = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const profileReview = ref<'none' | 'required' | 'changed'>('none')
function validMarker(value: unknown): value is string {
  return typeof value === 'string' && value.length === 67 && /^v1:[0-9a-f]{64}$/.test(value)
}
const profile = computed(() => profileStatus.value === 'success' && loadedProfile.value?.user.id === ownerId.value
  && validMarker(loadedProfile.value?.candidateContext) ? loadedProfile.value : null)
const contacts = computed(() => applicationContacts(profile.value))
const profileReady = computed(() => canSubmitApplication(profile.value))
const canReview = computed(() => open.value && !submitting.value && profileReady.value && profileReview.value !== 'required'
  && Boolean(props.vacancy.applicationContext) && listingState.value === 'ready' && !refreshing.value)
function acknowledge(checked: boolean | 'indeterminate') {
  const expectedContext = props.vacancy.applicationContext
  consent.value = checked === true && canReview.value && ownerId.value && expectedContext && profile.value
    ? { owner: ownerId.value, vacancyId: props.vacancy.id, expectedContext, expectedCandidateContext: profile.value.candidateContext }
    : null
}
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
function resetDraft() {
  sessionGeneration++
  open.value = false
  reloadRequest?.abort()
  profileRequest?.abort()
  profileRequest = undefined
  loadedProfile.value = null
  profileStatus.value = 'idle'
  profileReview.value = 'none'
  submitting.value = false
  draft.value = ''
  error.value = ''
  outcome.value = null
  submittedId.value = null
  consent.value = null
  listingState.value = 'ready'
  refreshing.value = false
  editingProfile.value = false
  profileEditOwner = undefined
  sessionExpired.value = false
}
watch([ownerId, () => props.vacancy.id], resetDraft, { flush: 'sync' })
watch([() => props.vacancy.applicationContext, () => profile.value?.candidateContext, draft], () => {
  consent.value = null
}, { flush: 'sync' })
watch([open, sessionExpired], ([value, expired]) => {
  if (!value) consent.value = null
  else if (!expired && ownerId.value && profileStatus.value === 'idle' && listingState.value !== 'unavailable') void refreshProfile()
}, { flush: 'sync' })
async function confirmSession(signal?: AbortSignal) {
  const generation = sessionGeneration
  const fresh = await readApplicationSession(signal)
  if (generation !== sessionGeneration) return false
  session.value = fresh
  if (!fresh.user) {
    sessionExpired.value = true
    open.value = true
  }
  return generation === sessionGeneration && Boolean(fresh.user)
}
async function privateReadRejected(expired: boolean) {
  resetDraft()
  if (expired) {
    sessionExpired.value = true
    open.value = true
  }
  try {
    await confirmSession()
  } catch {
    // Keep the private form cleared, without changing the shared session on an inconclusive read.
  }
}
async function refreshProfile() {
  const owner = ownerId.value
  if (!owner || profileRequest) return
  const generation = sessionGeneration
  const current = () => generation === sessionGeneration && owner === ownerId.value
  const request = new AbortController()
  profileRequest = request
  profileStatus.value = 'pending'
  try {
    // The session cookie can have changed in another tab since consent.
    if (profileReview.value === 'required') {
      try {
        if (!await confirmSession(request.signal) || !current()) return
      } catch {
        if (current()) profileStatus.value = 'error'
        return
      }
    }
    const result = await $fetch<ReviewedCandidateProfileResponse>('/api/v1/profile', {
      cache: 'no-store', retry: false, timeout: 15_000, signal: request.signal,
    })
    if (!current()) return
    if (result?.user?.id != null && result.user.id !== owner) {
      await privateReadRejected(false)
      return
    }
    if (result?.user?.id !== owner || !validMarker(result.candidateContext)) {
      profileStatus.value = 'error'
      return
    }
    loadedProfile.value = result
    profileStatus.value = 'success'
    if (profileReview.value === 'required') profileReview.value = 'changed'
  } catch (cause) {
    if (!current()) return
    if ((cause as { statusCode?: number }).statusCode === 401) await privateReadRejected(true)
    else profileStatus.value = 'error'
  } finally {
    if (profileRequest === request) profileRequest = undefined
  }
}
async function reviewListing() {
  if (refreshing.value || listingState.value !== 'changed') return
  const generation = sessionGeneration
  const request = new AbortController()
  const timeout = setTimeout(() => request.abort(), 15_000)
  reloadRequest = request
  refreshing.value = true
  consent.value = null
  error.value = ''
  try {
    const result = await props.reloadListing(request.signal)
    if (generation !== sessionGeneration) return
    if (result === 'updated') listingState.value = 'ready'
    else if (result === 'unavailable') listingState.value = 'unavailable'
    else error.value = 'The listing could not be reloaded. Your cover note is still here. Try again.'
  } finally {
    clearTimeout(timeout)
    if (reloadRequest === request) {
      reloadRequest = undefined
      refreshing.value = false
    }
  }
}
function editProfile() {
  if (!profile.value || profileReview.value === 'required' || submitting.value) return
  profileEditOwner = user.value?.id
  consent.value = null
  open.value = false
  editingProfile.value = true
}
watch(editingProfile, async (value, previous) => {
  if (value || !previous) return
  const owner = profileEditOwner
  await nextTick()
  if (owner && user.value?.id === owner) open.value = true
})
function profileSaved(value: ReviewedCandidateProfileResponse) {
  if (!editingProfile.value || profileEditOwner !== ownerId.value || value.user.id !== ownerId.value) return
  consent.value = null
  loadedProfile.value = value
  profileStatus.value = validMarker(value.candidateContext) ? 'success' : 'error'
}
async function signedIn() {
  await nextTick()
  if (loggedIn.value) {
    sessionExpired.value = false
    open.value = true
  }
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
  const reviewed = consent.value
  if (
    !canReview.value || !reviewed ||
    reviewed.owner !== ownerId.value || reviewed.vacancyId !== props.vacancy.id ||
    reviewed.expectedContext !== props.vacancy.applicationContext || reviewed.expectedCandidateContext !== profile.value?.candidateContext ||
    applied.value ||
    props.vacancy.source.status === 'DEMO'
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
      body: {
        coverLetter: draft.value || null, disclosureVersion: applicationDisclosureVersion, shareAcknowledged: true,
        expectedContext: reviewed.expectedContext, expectedCandidateContext: reviewed.expectedCandidateContext,
      },
    })
    if (!current()) return
    if (!Number.isInteger(receipt?.id) || receipt.id < 1 || receipt.id > 2_147_483_647) {
      error.value = unconfirmedReceipt
      return
    }
    submittedId.value = receipt.id
    outcome.value = 'submitted'
    draft.value = ''
    open.value = false
    haptic('success')
    await refresh()
  } catch (cause) {
    if (!current()) return
    const failure = cause as { statusCode?: number; data?: { code?: string } }
    if (failure.statusCode === 401) {
      await privateReadRejected(true)
      return
    }
    if (failure.statusCode === 404) {
      consent.value = null
      listingState.value = 'unavailable'
    } else if (failure.statusCode === 412 && failure.data?.code === 'CANDIDATE_REVIEW_REQUIRED') {
      consent.value = null
      profileReview.value = 'required'
      await refreshProfile()
    } else if (failure.statusCode === 412) {
      consent.value = null
      listingState.value = 'changed'
      error.value = 'This listing changed. Reload it and review the company and role again before applying. Your cover note is still here.'
    } else if (failure.statusCode === 409) {
      outcome.value = 'already'
      open.value = false
      await refresh()
    } else {
      error.value = failure.statusCode === 422
        ? 'Review your profile and contact details, then try again. Your cover note is still here.'
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
        v-else-if="listingState === 'unavailable'"
        label="Application unavailable"
        color="neutral"
        variant="outline"
        class="min-h-11 flex-1 justify-center"
        @click="open = true"
      />
      <UButton
        v-else
        :label="loggedIn && !sessionExpired ? 'Apply' : 'Sign in to apply'"
        :disabled="!initialized || (loggedIn && status === 'pending')"
        class="min-h-11 flex-1 justify-center"
        @click="open = true"
      />
    </div>
    <UModal
      v-model:open="open"
      :title="listingState === 'unavailable' ? 'Application unavailable' : `Apply for ${vacancy.title}`"
      :description="vacancy.company.name"
      :dismissible="!submitting"
      :ui="{ wrapper: 'min-w-0 pe-10', title: 'break-words', content: '[overflow-wrap:anywhere]' }"
    >
      <template #body>
        <section v-if="listingState === 'unavailable'" class="space-y-4">
          <p role="status" class="text-default">Submission is no longer available for this application.</p>
          <UFormField v-if="draft" label="Cover note" hint="You can copy it before leaving.">
            <UTextarea :model-value="draft" readonly :rows="6" class="w-full" />
          </UFormField>
          <UButton to="/jobs" label="Browse jobs" icon="i-lucide-search" />
        </section>
        <AuthSignInPanel
          v-else-if="!loggedIn || sessionExpired"
          :vacancy-id="vacancy.id"
          :application-context="vacancy.applicationContext"
          :title="sessionExpired ? 'Sign in again to apply' : undefined"
          :description="sessionExpired ? 'Your session ended. For privacy, the previous cover note was cleared. You are still on the same vacancy.' : undefined"
          @completed="signedIn"
        />
        <form
          v-else
          id="vacancy-application"
          ref="keyboardForm"
          class="space-y-5"
          @submit.prevent="submit"
        >
          <p class="text-sm text-muted">
            Your current profile and cover note go to the TalentBay team, not
            directly to the employer. We contact the company to propose your candidacy.
          </p>
          <UAlert v-if="profileReview === 'changed' && profile" title="Your profile changed" description="Review the updated details and confirm again before submitting." color="warning" variant="soft" role="status" />
          <USkeleton v-if="profileStatus === 'pending' || profileStatus === 'idle'" class="h-24 w-full" aria-label="Loading profile" />
          <UAlert v-else-if="!profile" title="Profile unavailable" color="error" :actions="[{ label: profileReview === 'required' ? 'Retry profile review' : 'Retry', onClick: refreshProfile }]" />
          <div v-else-if="profileReady || profileReview === 'changed'" class="space-y-2 border-y border-default py-4 text-sm" aria-label="Application profile preview">
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
          <UAlert v-if="profile && !profileReady" title="Add a contact to your profile" description="Save your profile with a phone number or Telegram username, or use the email already on your account." color="warning" variant="soft" />
          <UButton label="Review your profile" icon="i-lucide-user-pen" color="neutral" variant="outline" :disabled="submitting || !profile || profileReview === 'required'" @click="editProfile" />
          <UFormField
            label="Cover note"
            hint="Optional"
          >
            <UTextarea
              v-model="draft"
              :readonly="submitting"
              :rows="6"
              maxlength="5000"
              class="w-full"
            />
          </UFormField>
          <UCheckbox :model-value="Boolean(consent)" :label="`I ask TalentBay to contact ${vacancy.company.name} and share this application with them for this role.`" :disabled="!canReview" @update:model-value="acknowledge" />
          <p class="text-xs text-muted">You can withdraw in Applications. Withdrawal stops further handling here; it cannot recall information already shared outside TalentBay. No employer response or placement is guaranteed.</p>
          <UAlert
            v-if="error"
            color="error"
            :title="error === unconfirmedReceipt ? 'Submission not confirmed' : 'Application failed'"
            :description="error"
          />
          <UButton v-if="listingState === 'changed'" label="Reload listing" icon="i-lucide-refresh-cw" variant="outline" :loading="refreshing" @click="reviewListing" />
        </form>
      </template>
      <template
        v-if="loggedIn && !sessionExpired && listingState !== 'unavailable'"
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
            :disabled="!canReview || applied || !consent"
          />
        </div>
      </template>
    </UModal>
    <CandidatesProfileEditor
      v-if="loggedIn"
      :key="user?.id"
      v-model:open="editingProfile"
      :profile="profile?.profile || null"
      :profile-owner-id="profile?.user.id ?? null"
      @owner-mismatch="resetDraft"
      @saved="profileSaved"
    />
  </div>
</template>

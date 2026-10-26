<script setup lang="ts">
import type { CandidateProfileResponse } from '#shared/types/candidates'
import { profileSections } from '~/utils/candidate-profile'

definePageMeta({ layout: 'product' })
useSeoMeta({ title: 'Profile · TalentBay', robots: 'noindex' })
const { loggedIn } = useUserSession()
const { data, status, error, refresh } =
  await useAccountResource<CandidateProfileResponse>(
    'candidate-profile',
    '/api/v1/profile',
  )
const editing = ref(false)
const sections = computed(() => profileSections(data.value?.profile))
const completed = computed(
  () => sections.value.filter((section) => section.complete).length,
)
const missing = computed(() =>
  sections.value
    .filter((section) => !section.complete)
    .map((section) => section.label)
    .join(', '),
)
const toast = useToast()
function saved(value: CandidateProfileResponse) {
  data.value = value
  toast.add({ title: 'Profile saved', color: 'success' })
}
const details = computed(() => [
  {
    label: 'Professional',
    icon: 'i-lucide-user-round',
    value: data.value?.profile?.headline,
  },
  {
    label: 'Location',
    icon: 'i-lucide-map-pin',
    value: [data.value?.profile?.city, data.value?.profile?.countryCode]
      .filter(Boolean)
      .join(', '),
  },
  {
    label: 'Telegram',
    icon: 'i-lucide-send',
    value: data.value?.profile?.telegram,
  },
  { label: 'Phone', icon: 'i-lucide-phone', value: data.value?.profile?.phone },
])
const githubUrl = computed(() => safeHttpUrl(data.value?.profile?.githubUrl))
const linkedinUrl = computed(() =>
  safeHttpUrl(data.value?.profile?.linkedinUrl),
)
</script>

<template>
  <div class="product-container py-5 lg:py-10">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-[32px] leading-10 font-bold text-highlighted">Profile</h1>
      <UButton
        to="/settings"
        icon="i-lucide-settings"
        color="neutral"
        variant="ghost"
        aria-label="Settings"
        class="size-11 shrink-0 justify-center p-0"
      />
    </div>
    <AuthSignInPanel v-if="!loggedIn" />
    <template v-else>
      <USkeleton
        v-if="status === 'pending' && !data"
        class="mt-5 h-64 max-w-3xl rounded-lg"
        aria-label="Loading profile"
      />
      <UAlert
        v-else-if="error"
        class="mt-5"
        color="error"
        title="Your profile could not be loaded"
        :actions="[{ label: 'Retry', onClick: () => refresh() }]"
      />
      <div
        v-else-if="data"
        class="mt-4 grid max-w-5xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-4 border-b border-default pb-6">
            <UAvatar
              :src="data.user.avatarUrl || undefined"
              :alt="data.user.name"
              size="2xl"
            />
            <div class="min-w-0">
              <h2 class="break-words text-2xl font-semibold text-highlighted">
                {{ data.user.name }}
              </h2>
              <p
                v-if="data.user.email"
                class="mt-1 break-all text-sm text-muted"
              >
                {{ data.user.email }}
              </p>
              <NuxtLink
                to="/settings"
                class="mt-2 inline-block text-sm text-primary"
              >
                Sign-in methods
              </NuxtLink>
            </div>
          </div>
          <dl class="divide-y divide-default">
            <div
              v-for="detail in details"
              :key="detail.label"
              class="flex min-h-20 items-center gap-3 py-4"
            >
              <UIcon
                :name="detail.icon"
                class="size-5 shrink-0 text-muted"
              />
              <div class="min-w-0 flex-1">
                <dt class="text-xs text-muted">
                  {{ detail.label }}
                </dt>
                <dd class="mt-1 break-words text-base text-highlighted">
                  {{ detail.value || 'Not added yet' }}
                </dd>
              </div>
              <UButton
                icon="i-lucide-pencil"
                :aria-label="`Edit ${detail.label.toLowerCase()}`"
                color="neutral"
                variant="ghost"
                class="size-11 shrink-0 justify-center p-0"
                @click="editing = true"
              />
            </div>
            <div class="py-4">
              <dt class="text-xs text-muted">Links</dt>
              <dd class="mt-2 flex flex-wrap gap-4">
                <a
                  v-if="githubUrl"
                  :href="githubUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary underline"
                >
                  GitHub
                </a>
                <a
                  v-if="linkedinUrl"
                  :href="linkedinUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary underline"
                >
                  LinkedIn
                </a>
                <span
                  v-if="!githubUrl && !linkedinUrl"
                  class="text-muted"
                >
                  Not added yet
                </span>
              </dd>
            </div>
            <div class="py-4">
              <dt class="text-sm font-semibold text-highlighted">About</dt>
              <dd
                class="mt-3 whitespace-pre-line break-words text-sm leading-6 text-default"
              >
                {{ data.profile?.about || 'Not added yet' }}
              </dd>
            </div>
          </dl>
        </div>
        <aside
          class="border-t border-default pt-5 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0"
          aria-label="Profile completeness"
        >
          <div class="flex justify-between gap-3">
            <h2 class="text-sm font-semibold text-highlighted">
              Profile completeness
            </h2>
            <span class="shrink-0 text-xs text-primary">
              {{ completed }} / 5
            </span>
          </div>
          <UProgress
            :model-value="completed"
            :max="5"
            class="mt-3"
            aria-label="Profile completeness"
          />
          <p
            v-if="missing"
            class="mt-3 text-xs leading-5 text-muted"
          >
            Missing: {{ missing }}
          </p>
          <p
            v-else
            class="mt-3 text-sm text-muted"
          >
            Your profile is ready.
          </p>
          <UButton
            label="Edit profile"
            icon="i-lucide-pencil"
            block
            class="mt-4"
            @click="editing = true"
          />
          <UButton
            to="/applications"
            label="Your applications"
            icon="i-lucide-briefcase-business"
            color="neutral"
            variant="outline"
            block
            class="mt-3"
          />
        </aside>
        <CandidatesProfileEditor
          v-model:open="editing"
          :profile="data.profile"
          @saved="saved"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type {
  CandidateApplicationsResponse,
  CandidateProfileResponse,
} from '#shared/types/candidates'

definePageMeta({
  layout: 'product',
  middleware: 'auth',
})

useSeoMeta({
  title: 'Candidate profile · TalentBay',
})

const { user, clear } = useUserSession()
const saving = ref(false)
const saveError = ref('')
const saved = ref(false)

const { data, status, error } = await useFetch<CandidateProfileResponse>('/api/v1/profile')
const {
  data: applications,
  error: applicationsError,
} = await useFetch<CandidateApplicationsResponse>('/api/v1/applications')

const form = reactive({
  headline: '',
  about: '',
  countryCode: '',
  city: '',
  phone: '',
  telegram: '',
  githubUrl: '',
  linkedinUrl: '',
})

watch(data, (value) => {
  if (!value?.profile) {
    return
  }

  Object.assign(form, {
    headline: value.profile.headline || '',
    about: value.profile.about || '',
    countryCode: value.profile.countryCode || '',
    city: value.profile.city || '',
    phone: value.profile.phone || '',
    telegram: value.profile.telegram || '',
    githubUrl: value.profile.githubUrl || '',
    linkedinUrl: value.profile.linkedinUrl || '',
  })
}, { immediate: true })

async function saveProfile() {
  saving.value = true
  saveError.value = ''
  saved.value = false

  try {
    await $fetch('/api/v1/profile', {
      method: 'PUT',
      body: form,
    })
    saved.value = true
  }
  catch {
    saveError.value = 'Your profile could not be saved. Check the fields and try again.'
  }
  finally {
    saving.value = false
  }
}

async function signOut() {
  await clear()
  await navigateTo('/jobs')
}
</script>

<template>
  <UContainer class="py-8 sm:py-10">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-sm font-semibold text-primary">Candidate workspace</p>
        <h1 class="mt-1 text-3xl font-bold text-highlighted">Your profile</h1>
        <p class="mt-2 text-sm text-muted">{{ user?.email }}</p>
      </div>
      <UButton
        label="Sign out"
        icon="i-lucide-log-out"
        color="neutral"
        variant="outline"
        @click="signOut"
      />
    </header>

    <UAlert
      v-if="error"
      class="mt-6"
      color="error"
      variant="soft"
      icon="i-lucide-database-zap"
      title="Profile data unavailable"
      description="The PostgreSQL database must be connected before profiles can be saved."
    />

    <div class="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form
        class="rounded-lg border border-default bg-elevated p-5 sm:p-6"
        @submit.prevent="saveProfile"
      >
        <h2 class="text-xl font-semibold text-highlighted">Candidate details</h2>
        <p class="mt-1 text-sm text-muted">Only add information you want employers to use for recruitment.</p>

        <div class="mt-6 grid gap-5 sm:grid-cols-2">
          <UFormField label="Professional headline" class="sm:col-span-2">
            <UInput
              v-model="form.headline"
              placeholder="Senior TypeScript engineer"
              maxlength="160"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Country code">
            <UInput v-model="form.countryCode" placeholder="DE" maxlength="2" class="w-full" />
          </UFormField>

          <UFormField label="City">
            <UInput v-model="form.city" placeholder="Berlin" maxlength="120" class="w-full" />
          </UFormField>

          <UFormField label="Phone">
            <UInput v-model="form.phone" type="tel" placeholder="+49..." class="w-full" />
          </UFormField>

          <UFormField label="Telegram">
            <UInput v-model="form.telegram" placeholder="@username" class="w-full" />
          </UFormField>

          <UFormField label="GitHub URL">
            <UInput v-model="form.githubUrl" type="url" placeholder="https://github.com/..." class="w-full" />
          </UFormField>

          <UFormField label="LinkedIn URL">
            <UInput v-model="form.linkedinUrl" type="url" placeholder="https://linkedin.com/in/..." class="w-full" />
          </UFormField>

          <UFormField label="About" class="sm:col-span-2">
            <UTextarea
              v-model="form.about"
              :rows="6"
              maxlength="5000"
              placeholder="Summarize your experience, preferred roles and relocation goals."
              class="w-full"
            />
          </UFormField>
        </div>

        <UAlert
          v-if="saveError"
          class="mt-5"
          color="error"
          variant="soft"
          title="Save failed"
          :description="saveError"
        />
        <UAlert
          v-if="saved"
          class="mt-5"
          color="success"
          variant="soft"
          title="Profile saved"
        />

        <div class="mt-6 flex justify-end">
          <UButton
            type="submit"
            label="Save profile"
            icon="i-lucide-save"
            :loading="saving"
            :disabled="status === 'pending' || Boolean(error)"
          />
        </div>
      </form>

      <aside>
        <h2 class="text-xl font-semibold text-highlighted">Applications</h2>
        <UAlert
          v-if="applicationsError"
          class="mt-4"
          color="error"
          variant="soft"
          title="Applications unavailable"
        />
        <div v-else-if="applications?.items.length" class="mt-4 space-y-3">
          <article
            v-for="application in applications.items"
            :key="application.id"
            class="rounded-lg border border-default bg-elevated p-4"
          >
            <NuxtLink
              :to="`/jobs/${application.vacancy.slug}`"
              class="font-semibold text-highlighted hover:text-primary"
            >
              {{ application.vacancy.title }}
            </NuxtLink>
            <p class="mt-1 text-sm text-default">{{ application.vacancy.companyName }}</p>
            <div class="mt-3 flex items-center justify-between gap-3">
              <UBadge :label="application.status" color="neutral" variant="soft" />
              <time class="text-xs text-muted" :datetime="application.createdAt">
                {{ new Date(application.createdAt).toLocaleDateString('en') }}
              </time>
            </div>
          </article>
        </div>
        <UEmpty
          v-else
          class="mt-4"
          icon="i-lucide-send"
          title="No applications yet"
          description="Verified vacancies you apply to will appear here."
        />
      </aside>
    </div>
  </UContainer>
</template>

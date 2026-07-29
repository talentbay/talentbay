<script setup lang="ts">
import type { VacancyListItem } from '#shared/types/vacancies'

definePageMeta({
  layout: 'product',
})

const route = useRoute()
const { loggedIn } = useUserSession()
const { isSaved, toggleSaved } = useSavedVacancies()
const slug = computed(() => String(route.params.slug))
const applicationOpen = ref(false)
const coverLetter = ref('')
const applying = ref(false)
const applicationError = ref('')
const applicationCreated = ref(false)

const { data: vacancy, error } = await useFetch<VacancyListItem>(
  () => `/api/v1/vacancies/${slug.value}`,
)

if (error.value || !vacancy.value) {
  throw createError({
    statusCode: error.value?.statusCode || 404,
    statusMessage: 'Vacancy not found',
  })
}

useSeoMeta({
  title: () => `${vacancy.value?.title} at ${vacancy.value?.company.name} · TalentBay`,
  description: () => vacancy.value?.summary,
})

const salary = computed(() => {
  if (!vacancy.value?.salary) {
    return 'Salary not disclosed'
  }

  const formatter = new Intl.NumberFormat('en', {
    style: 'currency',
    currency: vacancy.value.salary.currency,
    notation: 'compact',
    maximumFractionDigits: 0,
  })

  return `${formatter.format(vacancy.value.salary.min)}–${formatter.format(vacancy.value.salary.max)} / year`
})

const location = computed(() => {
  if (!vacancy.value) {
    return ''
  }

  const workplace = vacancy.value.workplaceType.charAt(0)
    + vacancy.value.workplaceType.slice(1).toLowerCase()

  return [
    vacancy.value.location.city,
    vacancy.value.location.countryName,
    workplace,
  ].filter(Boolean).join(' · ')
})

const relocationLocation = computed(() => {
  return vacancy.value?.location.city
    ?.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'london'
})

const relocationSalary = computed(() => {
  const vacancySalary = vacancy.value?.salary
  return vacancySalary
    ? Math.round((vacancySalary.min + vacancySalary.max) / 2)
    : 110_000
})

const signInUrl = computed(() => ({
  path: '/user/login',
  query: { redirect: route.fullPath },
}))

async function applyToVacancy() {
  if (!vacancy.value) {
    return
  }

  applying.value = true
  applicationError.value = ''

  try {
    await $fetch(`/api/v1/vacancies/${vacancy.value.id}/applications`, {
      method: 'POST',
      body: {
        coverLetter: coverLetter.value || null,
      },
    })
    applicationCreated.value = true
    applicationOpen.value = false
  }
  catch (error: unknown) {
    const statusCode = typeof error === 'object'
      && error
      && 'statusCode' in error
      ? Number(error.statusCode)
      : 0

    applicationError.value = statusCode === 409
      ? 'You have already applied to this vacancy.'
      : 'Your application could not be submitted. Please try again.'
  }
  finally {
    applying.value = false
  }
}
</script>

<template>
  <UContainer v-if="vacancy" class="py-8 sm:py-10">
    <NuxtLink
      to="/jobs"
      class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-highlighted"
    >
      <UIcon name="i-lucide-arrow-left" class="size-4" />
      All jobs
    </NuxtLink>

    <div class="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <article>
        <header class="border-b border-default pb-7">
          <div class="flex items-start gap-4">
            <UAvatar
              :text="vacancy.company.initials"
              :alt="vacancy.company.name"
              size="xl"
              class="shrink-0"
            />
            <div class="min-w-0">
              <p class="text-sm font-semibold text-primary">{{ vacancy.company.name }}</p>
              <h1 class="mt-1 text-3xl font-bold text-highlighted sm:text-4xl">
                {{ vacancy.title }}
              </h1>
              <p class="mt-3 text-sm text-muted sm:text-base">{{ location }}</p>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-2">
            <UBadge :label="vacancy.seniority" color="neutral" variant="soft" />
            <UBadge
              v-for="skill in vacancy.skills"
              :key="skill"
              :label="skill"
              color="neutral"
              variant="soft"
            />
            <UBadge
              v-if="vacancy.relocationOffered"
              label="Relocation"
              color="primary"
              variant="soft"
            />
            <UBadge
              v-if="vacancy.visaSponsorship"
              label="Visa support"
              color="success"
              variant="soft"
            />
          </div>
        </header>

        <section class="py-7" aria-labelledby="role-overview">
          <h2 id="role-overview" class="text-xl font-semibold text-highlighted">Role overview</h2>
          <p class="mt-3 max-w-3xl text-base leading-7 text-default">{{ vacancy.description }}</p>
          <p class="mt-4 max-w-3xl text-base leading-7 text-default">{{ vacancy.summary }}</p>
        </section>

        <UAlert
          v-if="vacancy.source.status === 'DEMO'"
          color="warning"
          variant="soft"
          icon="i-lucide-flask-conical"
          title="Preview vacancy"
          description="This fictional vacancy validates the product workflow. It is not an active job offer."
        />

      </article>

      <aside class="space-y-5 lg:sticky lg:top-24">
        <section class="rounded-lg border border-default bg-elevated p-5">
          <p class="text-sm text-muted">Salary range</p>
          <p class="mt-1 text-xl font-bold text-highlighted">{{ salary }}</p>
          <UButton
            v-if="vacancy.source.status === 'DEMO'"
            label="Preview only"
            icon="i-lucide-flask-conical"
            block
            size="lg"
            disabled
            class="mt-5"
          />
          <UButton
            v-else-if="!loggedIn"
            :to="signInUrl"
            label="Sign in to apply"
            icon="i-lucide-send"
            block
            size="lg"
            class="mt-5"
          />
          <UButton
            v-else
            label="Apply"
            icon="i-lucide-send"
            block
            size="lg"
            class="mt-5"
            @click="applicationOpen = !applicationOpen"
          />

          <form
            v-if="applicationOpen"
            class="mt-4"
            @submit.prevent="applyToVacancy"
          >
            <UFormField label="Cover note" hint="Optional">
              <UTextarea
                v-model="coverLetter"
                :rows="5"
                maxlength="5000"
                placeholder="Briefly explain why this role fits."
                class="w-full"
              />
            </UFormField>
            <UButton
              type="submit"
              label="Submit application"
              block
              :loading="applying"
              class="mt-3"
            />
          </form>

          <UAlert
            v-if="applicationCreated"
            class="mt-4"
            color="success"
            variant="soft"
            title="Application submitted"
          />
          <UAlert
            v-if="applicationError"
            class="mt-4"
            color="error"
            variant="soft"
            title="Application failed"
            :description="applicationError"
          />
          <UButton
            :label="isSaved(vacancy.slug) ? 'Saved' : 'Save vacancy'"
            :icon="isSaved(vacancy.slug) ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'"
            color="neutral"
            variant="outline"
            block
            class="mt-3"
            @click="toggleSaved(vacancy.slug)"
          />
        </section>

        <RelocationPreview
          v-if="vacancy.relocationOffered"
          :initial-location="relocationLocation"
          :initial-annual-gross="relocationSalary"
        />
      </aside>
    </div>
  </UContainer>
</template>

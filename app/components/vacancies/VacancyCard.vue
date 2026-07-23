<script setup lang="ts">
import type { VacancyListItem } from '#shared/types/vacancies'

const props = defineProps<{
  vacancy: VacancyListItem
}>()

const { isSaved, toggleSaved } = useSavedVacancies()
const saved = computed(() => isSaved(props.vacancy.slug))

const salary = computed(() => {
  if (!props.vacancy.salary) {
    return 'Salary not disclosed'
  }

  const formatter = new Intl.NumberFormat('en', {
    style: 'currency',
    currency: props.vacancy.salary.currency,
    notation: 'compact',
    maximumFractionDigits: 0,
  })

  return `${formatter.format(props.vacancy.salary.min)}–${formatter.format(props.vacancy.salary.max)}`
})

const location = computed(() => {
  const parts = [
    props.vacancy.location.city,
    props.vacancy.location.countryName,
    props.vacancy.workplaceType.charAt(0) + props.vacancy.workplaceType.slice(1).toLowerCase(),
    props.vacancy.employmentType
      .split('_')
      .map(value => value.charAt(0) + value.slice(1).toLowerCase())
      .join('-'),
  ]

  return parts.filter(Boolean).join(' · ')
})

const published = computed(() => {
  const days = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(props.vacancy.publishedAt)) / 86_400_000),
  )

  return days === 0 ? 'Today' : `${days}d ago`
})
</script>

<template>
  <article class="rounded-lg border border-default bg-elevated p-4 transition hover:border-primary sm:p-5">
    <div class="flex items-start gap-3 sm:gap-4">
      <UAvatar
        :text="vacancy.company.initials"
        :alt="vacancy.company.name"
        size="lg"
        class="shrink-0"
      />

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <NuxtLink
              :to="`/jobs/${vacancy.slug}`"
              class="text-base font-semibold text-highlighted hover:text-primary sm:text-lg"
            >
              {{ vacancy.title }}
            </NuxtLink>
            <p class="mt-0.5 text-sm font-medium text-default">{{ vacancy.company.name }}</p>
          </div>

          <UButton
            :icon="saved ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'"
            color="neutral"
            variant="ghost"
            square
            size="sm"
            :aria-label="saved ? 'Remove saved vacancy' : 'Save vacancy'"
            @click="toggleSaved(vacancy.slug)"
          />
        </div>

        <p class="mt-1 text-xs text-muted sm:text-sm">{{ location }}</p>
      </div>
    </div>

    <div class="mt-3 flex items-center justify-between gap-4">
      <p class="font-semibold text-highlighted">{{ salary }}</p>
      <p class="shrink-0 text-xs text-muted">Posted {{ published }}</p>
    </div>

    <p class="mt-3 line-clamp-2 text-sm leading-5 text-default">
      {{ vacancy.summary }}
    </p>

    <div class="mt-4 flex flex-wrap gap-2">
      <UBadge
        v-for="skill in vacancy.skills.slice(0, 2)"
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
  </article>
</template>

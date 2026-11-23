<script setup lang="ts">
import type { VacancyListItem } from '#shared/types/vacancies'
import { formatVacancySalary } from '~/utils/vacancy-salary'
import { vacancyPublicationAge } from '~/utils/vacancy-dates'

const props = defineProps<{
  vacancy: VacancyListItem
}>()
const emit = defineEmits<{ removed: [slug: string, position: number] }>()

const { isSaved, toggleSaved, savedSlugs, initialized } = useSavedVacancies()
const saved = computed(() => isSaved(props.vacancy.slug))
const { haptic } = useProductHost()
const toast = useToast()

function save() {
  const position = savedSlugs.value.indexOf(props.vacancy.slug)
  if (!toggleSaved(props.vacancy.slug)) {
    toast.add({ title: 'Your shortlist is full', description: 'Remove a saved role before adding another.', color: 'warning' })
    return
  }
  haptic()
  if (position >= 0) emit('removed', props.vacancy.slug, position)
}

const salary = computed(() => formatVacancySalary(props.vacancy.salary))

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

const published = computed(() => vacancyPublicationAge(props.vacancy.publishedAt))
</script>

<template>
  <article class="relative isolate rounded-lg border border-default bg-elevated p-4 transition hover:border-primary sm:p-5">
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
              class="break-words text-base font-semibold text-highlighted after:absolute after:inset-0 after:z-1 after:rounded-lg hover:text-primary focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary sm:text-lg"
            >
              {{ vacancy.title }}
            </NuxtLink>
            <p class="mt-0.5 text-sm font-medium text-default">{{ vacancy.company.name }}</p>
          </div>

          <div class="relative z-10 shrink-0">
            <VacanciesSaveButton
              :saved="saved"
              :disabled="!initialized"
              @click="save"
            />
          </div>
        </div>

        <p class="mt-1 text-xs text-muted sm:text-sm">{{ location }}</p>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <p class="text-sm font-semibold text-highlighted lg:text-base">{{ salary }}</p>
      <p class="shrink-0 text-xs text-muted">{{ published ? `Published ${published}` : 'Publication date unavailable' }}</p>
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

<script setup lang="ts">
import { formatVacancyDate } from '~/utils/vacancy-dates'
defineProps<{ dates: { label: string; value: string | null | undefined }[] }>()
</script>

<template>
  <dl class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
    <div v-for="date in dates" :key="date.label" class="min-w-0">
      <dt class="text-muted">{{ date.label }}</dt>
      <dd class="mt-1 break-words">
        <time v-if="date.value" :datetime="date.value">{{ formatVacancyDate(date.value) }}</time>
        <span v-else>Not recorded</span>
      </dd>
    </div>
  </dl>
</template>

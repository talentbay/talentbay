<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import type { RelocationPreviewResponse } from '#shared/types/vacancies'

const props = withDefaults(defineProps<{
  initialLocation?: string
  initialAnnualGross?: number
}>(), {
  initialLocation: 'london',
  initialAnnualGross: 110_000,
})

const location = ref(props.initialLocation)
const annualGross = ref(props.initialAnnualGross)
const debouncedGross = refDebounced(annualGross, 300)

const locationItems = [
  { label: 'London, UK', value: 'london' },
  { label: 'Amsterdam, NL', value: 'amsterdam' },
  { label: 'Berlin, DE', value: 'berlin' },
  { label: 'Lisbon, PT', value: 'lisbon' },
]

const query = computed(() => ({
  location: location.value,
  annualGross: debouncedGross.value,
}))

const { data, status, error } = await useFetch<RelocationPreviewResponse>(
  '/api/v1/relocation/preview',
  { query },
)

const money = (value: number) => {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: data.value?.location.currency || 'GBP',
    maximumFractionDigits: 0,
  }).format(value)
}

const retainedPercent = computed(() => {
  const gross = data.value?.monthly.gross || 1
  const disposable = Math.max(0, data.value?.monthly.disposable || 0)
  return Math.min(100, Math.round((disposable / gross) * 100))
})
</script>

<template>
  <aside
    id="relocation-preview"
    class="rounded-lg border border-default bg-elevated p-5 lg:sticky lg:top-24 lg:p-6"
    aria-labelledby="relocation-preview-title"
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 id="relocation-preview-title" class="text-2xl font-semibold text-highlighted">
          Relocation preview
        </h2>
        <p class="mt-1 text-xs text-muted">One person · monthly estimate</p>
      </div>
      <UBadge label="Demo data" color="warning" variant="soft" />
    </div>

    <div class="mt-5 grid gap-4">
      <UFormField label="Destination">
        <USelect v-model="location" :items="locationItems" value-key="value" class="w-full" />
      </UFormField>

      <UFormField label="Annual gross salary">
        <UInput
          v-model.number="annualGross"
          type="number"
          min="1"
          inputmode="numeric"
          class="w-full"
        />
      </UFormField>
    </div>

    <div v-if="status === 'pending' && !data" class="mt-5 space-y-3">
      <USkeleton class="h-22 w-full rounded-lg" />
      <USkeleton class="h-2 w-full" />
      <USkeleton class="h-28 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      class="mt-5"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      title="Estimate unavailable"
      description="Try another destination or salary value."
    />

    <template v-else-if="data">
      <section class="mt-5 rounded-lg bg-muted p-4" aria-label="Disposable income">
        <p class="text-xs font-medium text-primary">After tax, rent and living costs</p>
        <p class="mt-1 text-3xl font-bold text-highlighted">
          {{ money(data.monthly.disposable) }}
          <span class="text-base font-semibold">/ month</span>
        </p>
      </section>

      <div class="mt-4 h-2 overflow-hidden rounded-full bg-accented" aria-hidden="true">
        <div
          class="h-full rounded-full bg-primary transition-[width]"
          :style="{ width: `${retainedPercent}%` }"
        />
      </div>

      <dl class="mt-5 space-y-4 text-sm">
        <div class="flex items-center justify-between gap-4">
          <dt class="text-muted">Net after tax</dt>
          <dd class="font-semibold text-highlighted">{{ money(data.monthly.netAfterTax) }}</dd>
        </div>
        <div class="flex items-center justify-between gap-4">
          <dt class="text-muted">Rent</dt>
          <dd class="font-semibold text-highlighted">− {{ money(data.monthly.rent) }}</dd>
        </div>
        <div class="flex items-center justify-between gap-4">
          <dt class="text-muted">Living costs</dt>
          <dd class="font-semibold text-highlighted">− {{ money(data.monthly.livingCosts) }}</dd>
        </div>
        <div class="flex items-center justify-between gap-4 border-t border-default pt-4">
          <dt class="font-semibold text-default">Disposable</dt>
          <dd class="font-bold text-highlighted">{{ money(data.monthly.disposable) }}</dd>
        </div>
      </dl>

      <p class="mt-5 text-xs leading-5 text-muted">{{ data.disclaimer }}</p>
    </template>
  </aside>
</template>

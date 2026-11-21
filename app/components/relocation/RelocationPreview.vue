<script setup lang="ts">
import type { RelocationLocationsResponse } from '#shared/types/vacancies'
import { annualGrossInputError, maxAnnualGross } from '#shared/utils/relocation-income'
import { relocationMoney } from '~/utils/relocation-presentation'
import { vacancyEstimateSource, type SalaryPoint } from '~/utils/relocation-draft'

const props = withDefaults(defineProps<{
  estimate?: ReturnType<typeof useRelocationEstimate>
  contextLabel?: string
  embedded?: boolean
}>(), { estimate: undefined, contextLabel: '', embedded: false })
const titleID = useId()
const interactive = ref(false)
onMounted(() => { interactive.value = true })
const {
  location, annualGross, markIncomeEdited, offeredRange, selectedPoint, choosePoint, destinations, selected, supported, valid, incomeError, notice, currentResult, updating, resource, locationsError, refreshLocations,
} = props.estimate ?? useRelocationEstimate(
  'standalone', () => vacancyEstimateSource({ key: 'london', currency: 'GBP' }, null),
  await useFetch<RelocationLocationsResponse>('/api/v1/relocation/locations', { key: 'relocation-locations' }),
)
const { error, execute } = await resource
const locationItems = computed(() => destinations.value.map(item => ({
  label: `${item.city}, ${item.countryCode}${item.availability === 'DEMO' ? ' · Demo' : item.availability === 'UNAVAILABLE' ? ' · Data unavailable' : ''}`,
  value: item.key, disabled: item.availability === 'UNAVAILABLE',
})))
const badge = computed(() => selected.value?.availability === 'REVIEWED' ? 'Reviewed data' : selected.value?.availability === 'DEMO' ? 'Demo data' : 'Unavailable')
const rangeChoices: { point: SalaryPoint; label: string }[] = [
  { point: 'low', label: 'Low' }, { point: 'midpoint', label: 'Midpoint' }, { point: 'high', label: 'High' },
]
const choices = computed(() => offeredRange.value?.low === offeredRange.value?.high ? [{ point: 'midpoint' as const, label: 'Listed salary' }] : rangeChoices)
const retainedPercent = computed(() => currentResult.value && currentResult.value.monthly.gross > 0
  ? Math.min(100, Math.max(0, Math.round(currentResult.value.monthly.disposable / currentResult.value.monthly.gross * 100))) : 0)
</script>

<template>
  <aside class="min-w-0" :class="embedded ? '' : 'rounded-lg border border-default bg-elevated p-5 lg:p-6'" :aria-labelledby="titleID">
    <p v-if="contextLabel" class="mb-3 break-words text-xs text-muted">{{ contextLabel }}</p>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 :id="titleID" :class="embedded ? 'sr-only' : 'text-lg font-semibold text-highlighted'">Relocation preview</h2>
        <p class="mt-1 text-xs text-muted">One adult · monthly estimate</p>
      </div>
      <UBadge :label="badge" :color="selected?.availability === 'REVIEWED' ? 'success' : selected?.availability === 'DEMO' ? 'warning' : 'neutral'" variant="soft" />
    </div>

    <UAlert v-if="locationsError" class="mt-4" color="error" title="Destinations unavailable" :actions="[{ label: 'Retry', icon: 'i-lucide-refresh-cw', onClick: () => refreshLocations() }]" />
    <div class="mt-5 grid gap-4">
      <UFormField label="Destination">
        <USelect v-model="location" :disabled="!interactive" :items="locationItems" value-key="value" class="w-full" />
      </UFormField>
      <UFormField v-if="supported" label="Annual gross salary" :hint="selected?.currency" :error="incomeError">
        <UInput v-model.number="annualGross" :disabled="!interactive" type="number" min="0" :max="maxAnnualGross" step="0.01" inputmode="decimal" class="w-full" @input="markIncomeEdited" />
      </UFormField>
      <fieldset v-if="offeredRange && selected" class="min-w-0">
        <legend class="mb-2 text-xs text-muted">
          Listed pay per year: {{ relocationMoney(offeredRange.low, selected.currency) }}<template v-if="offeredRange.high !== offeredRange.low"> to {{ relocationMoney(offeredRange.high, selected.currency) }}</template>
        </legend>
        <div class="flex flex-wrap gap-1">
          <UButton
            v-for="choice in choices" :key="choice.point" type="button" size="sm"
            :label="choice.label" :aria-pressed="selectedPoint === choice.point"
            :color="selectedPoint === choice.point ? 'primary' : 'neutral'"
            :variant="selectedPoint === choice.point ? 'soft' : 'outline'"
            :disabled="!interactive || Boolean(annualGrossInputError(offeredRange[choice.point]))"
            @click="choosePoint(choice.point)" />
        </div>
      </fieldset>
    </div>
    <p v-if="notice" class="mt-3 text-xs text-muted" role="status">{{ notice }}</p>
    <UAlert v-if="!supported && !locationsError" class="mt-5" color="neutral" variant="soft" title="Estimate unavailable" :description="selected ? `No reviewed estimate for ${selected.city} is available.` : 'Destination data is unavailable.'" />
    <p v-else-if="!valid && !incomeError && !locationsError" class="mt-4 text-sm text-muted">Choose a destination and enter a yearly income in its currency to see an estimate.</p>

    <div v-if="updating" class="mt-5 space-y-3" role="status" aria-label="Updating estimate">
      <USkeleton class="h-22 w-full rounded-lg" /><USkeleton class="h-2 w-full" /><USkeleton class="h-28 w-full" />
    </div>
    <UAlert
      v-else-if="error && valid"
      class="mt-5" color="error" variant="soft" icon="i-lucide-triangle-alert"
      title="Estimate unavailable" description="The estimate could not be loaded."
      :actions="[
        { label: 'Retry', icon: 'i-lucide-refresh-cw', onClick: () => execute() },
        { label: 'Refresh destinations', icon: 'i-lucide-map-pin', color: 'neutral', onClick: () => refreshLocations() },
      ]"
    />

    <template v-else-if="currentResult">
      <section class="mt-5 border-t border-default pt-4" aria-label="Disposable income" aria-live="polite">
        <p class="text-xs font-medium" :class="currentResult.monthly.disposable < 0 ? 'text-error' : 'text-primary'">
          {{ currentResult.monthly.disposable < 0 ? 'Monthly shortfall' : 'Monthly remainder' }}
        </p>
        <p class="mt-1 break-words text-2xl font-bold tabular-nums text-highlighted">
          {{ relocationMoney(currentResult.monthly.disposable, currentResult.location.currency) }}
          <span class="text-base font-semibold">/ month</span>
        </p>
        <p class="mt-1 text-xs text-muted">After modeled deductions, rent and living costs</p>
        <div class="mt-3 h-2 overflow-hidden rounded bg-accented" aria-hidden="true">
          <div class="h-full rounded bg-primary transition-[width]" :style="{ width: `${retainedPercent}%` }" />
        </div>
      </section>
      <RelocationEstimateBreakdown :estimate="currentResult" />
      <RelocationEstimateSources :estimate="currentResult" />
      <p v-if="currentResult.dataStatus === 'DEMO'" class="mt-4 text-xs leading-5 text-muted">{{ currentResult.disclaimer }}</p>
    </template>
  </aside>
</template>

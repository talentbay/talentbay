<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import type {
  RelocationLocationOption,
  RelocationPreviewResponse,
} from '#shared/types/vacancies'

const props = withDefaults(defineProps<{
  initialLocation?: string
  initialAnnualGross?: number | null
  contextKey?: string
  contextLabel?: string
}>(), {
  initialLocation: 'london',
  initialAnnualGross: null,
  contextKey: 'jobs',
  contextLabel: '',
})

const inputs = useState(`relocation-inputs:${props.contextKey}`, () => ({ location: props.initialLocation, annualGross: props.initialAnnualGross }))
const location = toRef(inputs.value, 'location')
const titleID = useId()
const annualGross = toRef(inputs.value, 'annualGross')
const debouncedGross = refDebounced(annualGross, 300)

const { data: locations, error: locationsError, refresh: refreshLocations } = await useFetch<{
  items: RelocationLocationOption[]
}>('/api/v1/relocation/locations')

const locationItems = computed(() => {
  if (!locations.value?.items.length) {
    return []
  }

  return locations.value.items.map(item => ({
    label: `${item.city}, ${item.countryCode}${item.dataStatus === 'DEMO' ? ' · Demo' : ''}`,
    value: item.key,
  }))
})
watch(locations, (value) => {
  if (!value?.items.length || value.items.some(item => item.key === location.value)) return
  const matches = value.items.filter(item => item.city.toLowerCase() === location.value)
  if (matches.length === 1) location.value = matches[0]!.key
}, { immediate: true })

const query = computed(() => ({
  location: location.value,
  annualGross: debouncedGross.value,
}))
const valid = computed(() => locationItems.value.some(item => item.value === location.value) && typeof debouncedGross.value === 'number' && Number.isFinite(debouncedGross.value) && debouncedGross.value >= 0 && debouncedGross.value <= 2_000_000)

const { data, status, error, execute, clear } = await useFetch<RelocationPreviewResponse>(
  '/api/v1/relocation/preview',
  { query, immediate: valid.value, watch: false },
)
watch([query, valid], () => { if (valid.value) void execute(); else clear() })

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
    class="rounded-lg border border-default bg-elevated p-5 lg:sticky lg:top-24 lg:p-6"
    :aria-labelledby="titleID"
  >
    <p v-if="contextLabel" class="mb-3 break-words text-xs text-muted">{{ contextLabel }}</p>
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 :id="titleID" class="text-lg font-semibold text-highlighted">
          Relocation preview
        </h2>
        <p class="mt-1 text-xs text-muted">One person · monthly estimate</p>
      </div>
      <UBadge
        :label="data?.dataStatus === 'VERIFIED' ? 'Verified data' : 'Demo data'"
        :color="data?.dataStatus === 'VERIFIED' ? 'success' : 'warning'"
        variant="soft"
      />
    </div>

    <UAlert v-if="locationsError" class="mt-4" color="error" title="Destinations unavailable" :actions="[{ label: 'Retry', onClick: () => refreshLocations() }]" />
    <div class="mt-5 grid gap-4">
      <UFormField label="Destination">
        <USelect v-model="location" :items="locationItems" value-key="value" class="w-full" />
      </UFormField>

      <UFormField label="Annual gross salary" :hint="locations?.items.find(item => item.key === location)?.currency">
        <UInput
          v-model.number="annualGross"
          type="number"
          min="0"
          max="2000000"
          step="0.01"
          inputmode="numeric"
          class="w-full"
        />
      </UFormField>
    </div>
    <p v-if="!valid" class="mt-4 text-sm text-muted">Choose a destination and enter a yearly income in its currency to see an estimate.</p>

    <div v-if="status === 'pending'" class="mt-5 space-y-3" role="status" aria-label="Updating estimate">
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

    <template v-else-if="valid && data">
      <section class="mt-5 rounded-lg bg-muted p-4" aria-label="Disposable income">
        <p class="text-xs font-medium text-primary">After tax, rent and living costs</p>
        <p class="mt-1 break-words text-2xl font-bold text-highlighted">
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

      <div class="mt-5 border-t border-default pt-4"><p class="text-sm font-semibold text-highlighted">Estimated one-time move</p><p class="mt-2 text-xl font-semibold text-highlighted">{{ money(data.oneTimeMove) }}</p></div>

      <p class="mt-5 text-xs leading-5 text-muted">{{ data.disclaimer }}</p>

      <div v-if="data.provenance.sources.length" class="mt-4 border-t border-default pt-4">
        <p class="text-xs font-semibold text-default">Sources</p>
        <ul class="mt-2 space-y-1 text-xs">
          <li v-for="source in data.provenance.sources" :key="source.url">
            <a
              :href="safeHttpUrl(source.url)"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:text-highlighted"
            >
              {{ source.label }}
            </a>
          </li>
        </ul>
      </div>
    </template>
  </aside>
</template>

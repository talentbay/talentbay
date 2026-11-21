<script setup lang="ts">
import type { RelocationPreviewResponse } from '#shared/types/vacancies'
import { relocationMoney } from '~/utils/relocation-presentation'
const props = defineProps<{ estimate: RelocationPreviewResponse }>()
const money = (value: number) => relocationMoney(value, props.estimate.location.currency)
const monthly = computed(() => [
  { label: 'Gross income', value: props.estimate.monthly.gross },
  { label: 'Modeled net income', value: props.estimate.monthly.netAfterTax },
  { label: 'Rent', value: -props.estimate.monthly.rent },
  { label: 'Living costs', value: -props.estimate.monthly.livingCosts },
])
const expenses = computed(() => props.estimate.details ? [
  { label: 'Utilities', value: props.estimate.details.monthlyCosts.utilities },
  { label: 'Groceries', value: props.estimate.details.monthlyCosts.groceries },
  { label: 'Transport', value: props.estimate.details.monthlyCosts.transport },
  { label: 'Healthcare', value: props.estimate.details.monthlyCosts.healthcare },
  { label: 'Other living costs', value: props.estimate.details.monthlyCosts.other },
] : [])
const moving = computed(() => props.estimate.details ? [
  { label: 'Flight', value: props.estimate.details.oneTimeCosts.flight },
  { label: 'Visa costs', value: props.estimate.details.oneTimeCosts.visa },
  { label: 'Deposit', value: props.estimate.details.oneTimeCosts.deposit },
  { label: 'Temporary housing', value: props.estimate.details.oneTimeCosts.temporaryHousing },
  { label: 'Other moving costs', value: props.estimate.details.oneTimeCosts.other },
] : [])
</script>

<template>
  <section class="mt-5 border-t border-default pt-4" aria-label="Monthly breakdown">
    <h3 class="text-sm font-semibold text-highlighted">Monthly breakdown</h3>
    <dl class="mt-3 space-y-3 text-sm">
      <div v-for="row in monthly" :key="row.label" class="grid grid-cols-[minmax(0,1fr)_max-content] gap-3">
        <dt class="text-muted">{{ row.label }}</dt><dd class="font-medium tabular-nums">{{ money(row.value) }}</dd>
      </div>
    </dl>
    <details v-if="estimate.details" class="mt-4 text-sm">
      <summary class="cursor-pointer py-2 text-primary focus-visible:outline-2 focus-visible:outline-primary">Living cost details</summary>
      <dl class="mt-2 space-y-2">
        <div v-for="row in expenses" :key="row.label" class="grid grid-cols-[minmax(0,1fr)_max-content] gap-3">
          <dt class="text-muted">{{ row.label }}</dt><dd class="tabular-nums">{{ money(row.value) }}</dd>
        </div>
      </dl>
    </details>
  </section>
  <section class="mt-5 border-t border-default pt-4" aria-label="Initial moving budget">
    <h3 class="text-sm font-semibold text-highlighted">Initial moving budget</h3>
    <p class="mt-2 text-xl font-semibold tabular-nums">{{ money(estimate.oneTimeMove) }}</p>
    <p class="mt-1 text-xs text-muted">Separate from monthly spending. This estimate does not calculate employer reimbursements.</p>
    <details v-if="estimate.details" class="mt-2 text-sm">
      <summary class="cursor-pointer py-2 text-primary focus-visible:outline-2 focus-visible:outline-primary">Moving budget details</summary>
      <dl class="mt-2 space-y-2">
        <div v-for="row in moving" :key="row.label" class="grid grid-cols-[minmax(0,1fr)_max-content] gap-3">
          <dt class="text-muted">{{ row.label }}</dt><dd class="tabular-nums">{{ money(row.value) }}</dd>
        </div>
      </dl>
      <p class="mt-3 text-xs text-muted">Deposit is included in initial cash needs, not monthly spending. These are estimates, not bookable offers.</p>
    </details>
  </section>
</template>

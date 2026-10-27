<script setup lang="ts">
import type { RelocationPreviewResponse } from '#shared/types/vacancies'
import { relocationDay } from '~/utils/relocation-presentation'
import { safeHttpUrl } from '~/utils/safe-http-url'
defineProps<{ estimate: RelocationPreviewResponse }>()
</script>

<template>
  <details class="mt-5 border-t border-default pt-2 text-sm">
    <summary class="cursor-pointer py-3 font-semibold text-primary focus-visible:outline-2 focus-visible:outline-primary">Data and assumptions</summary>
    <div class="space-y-4 pb-2 [overflow-wrap:anywhere]">
      <p class="text-xs leading-5 text-muted">{{ estimate.disclaimer }}</p>
      <dl v-if="estimate.dataStatus === 'VERIFIED'" class="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-1">
        <div><dt class="text-muted">Effective from</dt><dd class="mt-1">{{ relocationDay(estimate.provenance.effectiveFrom) }}</dd></div>
        <div><dt class="text-muted">Content reviewed</dt><dd class="mt-1">{{ relocationDay(estimate.provenance.reviewedAt) }}</dd></div>
        <div><dt class="text-muted">Review valid through</dt><dd class="mt-1">{{ relocationDay(estimate.provenance.validUntil) }} UTC</dd></div>
      </dl>
      <dl v-if="estimate.provenance.assumptions" class="space-y-3 text-xs leading-5">
        <div><dt class="font-semibold">Tax residency</dt><dd>{{ estimate.provenance.assumptions.taxResidency }}</dd></div>
        <div><dt class="font-semibold">Tax period</dt><dd>{{ estimate.provenance.assumptions.taxYear }}</dd></div>
        <div><dt class="font-semibold">Modeled deductions</dt><dd><ul class="list-inside list-disc"><li v-for="item in estimate.provenance.assumptions.includedTaxes" :key="item">{{ item }}</li></ul></dd></div>
        <div><dt class="font-semibold">Excluded deductions</dt><dd><ul class="list-inside list-disc"><li v-for="item in estimate.provenance.assumptions.excludedTaxes" :key="item">{{ item }}</li></ul><span v-if="!estimate.provenance.assumptions.excludedTaxes.length">None recorded</span></dd></div>
        <div><dt class="font-semibold">Housing basis</dt><dd>{{ estimate.provenance.assumptions.housing }}</dd></div>
        <div><dt class="font-semibold">Move route</dt><dd>{{ estimate.provenance.assumptions.moveRoute }}</dd></div>
        <div><dt class="font-semibold">Other exclusions</dt><dd><ul class="list-inside list-disc"><li v-for="item in estimate.provenance.assumptions.exclusions" :key="item">{{ item }}</li></ul></dd></div>
      </dl>
      <ul v-if="estimate.provenance.sources.length" class="space-y-3 text-xs">
        <li v-for="source in estimate.provenance.sources" :key="source.url">
          <a :href="safeHttpUrl(source.url)" target="_blank" rel="noopener noreferrer" class="text-primary underline">{{ source.label }}</a>
          <p class="mt-1 text-muted">Accessed {{ relocationDay(source.accessedAt) }}</p>
        </li>
      </ul>
      <p v-else class="text-xs text-muted">No reviewed source data. Figures are illustrative.</p>
    </div>
  </details>
</template>

<script setup lang="ts">
const portal = import.meta.dev ? useRuntimeConfig().public.localReviewPortal : ''
</script>

<template>
  <div v-if="portal" class="border-b border-default bg-elevated" role="note">
    <div class="product-container flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-xs text-muted">
      <span>Local test data. Nothing is sent to employers.</span>
      <a :href="portal" class="py-1 font-semibold text-primary underline">Switch test account</a>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ vacancyEntry?: boolean }>()
const { state: host } = useProductHost()
</script>

<template>
  <UAlert
    role="alert"
    :title="vacancyEntry ? 'Telegram sign-in did not complete. Close this Mini App and use the vacancy button in the bot chat again.' : host.message"
    color="warning"
    variant="soft"
    :ui="{ title: 'text-highlighted', description: 'text-default' }"
  >
    <template v-if="host.supportReference" #description>
      <div class="min-w-0 select-text [overflow-wrap:anywhere]">
        <p>Reference: {{ host.supportReference }}</p>
        <p v-if="host.supportRequestId">Request ID: {{ host.supportRequestId }}</p>
      </div>
    </template>
  </UAlert>
</template>

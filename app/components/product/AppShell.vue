<script setup lang="ts">
const { state: host } = useProductHost()
</script>

<template>
  <div class="min-h-screen bg-default text-default">
    <a
      href="#main-content"
      class="sr-only z-50 rounded bg-elevated p-3 text-highlighted focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >
      Skip to content
    </a>
    <ProductCandidateNavigation />
    <ProductLocalReviewNotice />
    <div
      v-if="host.status === 'connecting'"
      class="product-container pt-3 text-sm text-muted"
      role="status"
    >
      Signing you in to Telegram…
    </div>
    <div
      v-else-if="host.status === 'error' || host.status === 'conflict'"
      class="product-container pt-3"
    >
      <UAlert
        :title="host.message"
        color="warning"
        variant="soft"
        :actions="[{ label: 'Settings', to: '/settings' }]"
      />
    </div>
    <main
      id="main-content"
      tabindex="-1"
      class="candidate-main"
    >
      <slot />
    </main>
    <div class="hidden lg:block">
      <ProductAppFooter />
    </div>
  </div>
</template>

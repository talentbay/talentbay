<script setup lang="ts">
definePageMeta({
  layout: 'product',
})

useSeoMeta({
  title: 'Terms status · TalentBay',
  description: 'Status of the TalentBay terms of service.',
  robots: 'noindex, nofollow',
})
</script>

<template>
  <UContainer class="py-12 sm:py-20">
    <section class="mx-auto max-w-2xl" aria-labelledby="terms-title">
      <p class="text-sm font-semibold text-primary">Legal</p>
      <h1 id="terms-title" class="mt-2 text-3xl font-bold text-highlighted sm:text-4xl">
        Terms are under review
      </h1>
      <p class="mt-4 text-base leading-7 text-muted">
        The public Terms of Service have not been approved for release. TalentBay is currently an MVP preview and is not publishing token, payment or investment terms through the SaaS product.
      </p>

      <UAlert
        class="mt-7"
        color="warning"
        variant="soft"
        icon="i-lucide-file-clock"
        title="Not an effective legal document"
        description="Founder and legal approval is required before public production launch."
      />

      <UButton
        class="mt-7"
        to="/jobs"
        label="Back to jobs"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="outline"
      />
    </section>
  </UContainer>
</template>

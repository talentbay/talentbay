<script setup lang="ts">
definePageMeta({
  layout: 'product',
})

useSeoMeta({
  title: 'Privacy status · TalentBay',
  description: 'Status of the TalentBay privacy notice.',
  robots: 'noindex, nofollow',
})
</script>

<template>
  <UContainer class="py-12 sm:py-20">
    <section class="mx-auto max-w-2xl" aria-labelledby="privacy-title">
      <p class="text-sm font-semibold text-primary">Legal</p>
      <h1 id="privacy-title" class="mt-2 text-3xl font-bold text-highlighted sm:text-4xl">
        Privacy notice is under review
      </h1>
      <p class="mt-4 text-base leading-7 text-muted">
        The production privacy notice has not been approved for release. The current MVP limits account data to OAuth identity, candidate profile fields and submitted applications.
      </p>

      <UAlert
        class="mt-7"
        color="warning"
        variant="soft"
        icon="i-lucide-shield-alert"
        title="Public launch blocker"
        description="Data retention, user rights, processors, jurisdictions and contact details must be confirmed by legal before production."
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

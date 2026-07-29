<script setup lang="ts">
definePageMeta({
  layout: 'product',
})

const router = useRouter()
</script>

<template>
  <UContainer class="py-16 sm:py-24">
    <section class="mx-auto max-w-lg text-center" aria-labelledby="restricted-title">
      <span class="mx-auto flex size-12 items-center justify-center rounded-md bg-error/10 text-error">
        <UIcon name="i-lucide-lock-keyhole" class="size-6" />
      </span>
      <p class="mt-5 text-sm font-semibold text-error">
        Access restricted
      </p>
      <h1 id="restricted-title" class="mt-2 text-3xl font-bold text-highlighted">
        Sign in to continue
      </h1>
      <p class="mt-3 text-muted">
        This page requires an authenticated TalentBay account.
      </p>
      <div class="mt-7 flex flex-wrap justify-center gap-3">
        <UButton to="/user/login" label="Sign in" icon="i-lucide-log-in" />
        <UButton
          label="Go back"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="outline"
          @click="router.back()"
        />
      </div>
    </section>
  </UContainer>
</template>

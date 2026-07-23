<template>
  <footer class="mt-20 border-t border-default bg-elevated">
    <UContainer class="flex flex-col gap-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-2 text-highlighted">
        <span class="flex size-7 items-center justify-center rounded-md bg-talent-navy-900 text-xs font-bold text-white">
          T
        </span>
        <span class="font-semibold">TalentBay</span>
      </div>

      <nav class="flex items-center gap-5" aria-label="Legal">
        <NuxtLink to="/privacy" class="hover:text-primary">Privacy</NuxtLink>
        <NuxtLink to="/terms" class="hover:text-primary">Terms</NuxtLink>
      </nav>
    </UContainer>
  </footer>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'product' })
useSeoMeta({ title: 'Settings · TalentBay', robots: 'noindex' })
const colorMode = useColorMode()
const { state: host } = useProductHost()
const preferences = useJobPreferences()
const haptics = useState('haptics-enabled', () => true)
const themes = [
  { label: 'Host / system', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]
</script>

<template>
  <div class="product-container py-5 lg:py-10">
    <h1 class="text-[32px] leading-10 font-bold text-highlighted">Settings</h1>
    <div class="mt-4 max-w-2xl divide-y divide-default">
      <section
        class="pb-6"
        aria-labelledby="appearance-title"
      >
        <h2
          id="appearance-title"
          class="text-lg font-semibold text-highlighted"
        >
          Appearance
        </h2>
        <div class="mt-4 flex min-h-12 items-center justify-between gap-4">
          <label
            for="theme"
            class="text-sm"
          >
            Theme
          </label>
          <ClientOnly>
            <USelect
              id="theme"
              v-model="colorMode.preference"
              :items="themes"
              class="w-44"
            />
            <template #fallback>
              <USkeleton class="h-9 w-44" />
            </template>
          </ClientOnly>
        </div>
        <div
          v-if="host.haptics"
          class="mt-3 flex min-h-12 items-center justify-between gap-4"
        >
          <label
            for="haptics"
            class="text-sm"
          >
            Haptic feedback
          </label>
          <USwitch
            id="haptics"
            v-model="haptics"
            aria-label="Haptic feedback"
          />
        </div>
      </section>
      <section
        class="py-6"
        aria-labelledby="defaults-title"
      >
        <h2
          id="defaults-title"
          class="text-lg font-semibold text-highlighted"
        >
          Job defaults
        </h2>
        <p class="mt-2 text-xs text-muted">Saved on this device.</p>
        <div
          class="mt-4 flex min-h-12 flex-wrap items-center justify-between gap-3"
        >
          <label
            for="preferred-country"
            class="text-sm"
          >
            Preferred location
          </label>
          <USelect
            id="preferred-country"
            v-model="preferences.countryCode"
            :items="jobCountries"
            class="w-44"
          />
        </div>
        <div class="mt-3 flex min-h-12 items-center justify-between gap-4">
          <label
            for="visa-default"
            class="text-sm"
          >
            Visa sponsorship required
          </label>
          <USwitch
            id="visa-default"
            v-model="preferences.visaSponsorship"
            aria-label="Visa sponsorship required"
          />
        </div>
        <div class="mt-3 flex min-h-12 items-center justify-between gap-4">
          <label
            for="salary-default"
            class="text-sm"
          >
            Disclosed salary only
          </label>
          <USwitch
            id="salary-default"
            v-model="preferences.salaryDisclosed"
            aria-label="Disclosed salary only"
          />
        </div>
        <UButton
          to="/jobs?defaults=1"
          label="Browse with these defaults"
          trailing-icon="i-lucide-arrow-right"
          variant="outline"
          class="mt-4"
        />
      </section>
      <AuthConnectedMethods />
      <section
        class="py-6"
        aria-labelledby="privacy-title"
      >
        <h2
          id="privacy-title"
          class="text-lg font-semibold text-highlighted"
        >
          Privacy
        </h2>
        <NuxtLink
          to="/privacy"
          class="mt-3 flex min-h-12 items-center justify-between gap-3 text-sm text-primary"
        >
          Privacy notice
          <UIcon
            name="i-lucide-chevron-right"
            class="size-5"
          />
        </NuxtLink>
        <NuxtLink
          to="/terms"
          class="flex min-h-12 items-center justify-between gap-3 text-sm text-primary"
        >
          Terms
          <UIcon
            name="i-lucide-chevron-right"
            class="size-5"
          />
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

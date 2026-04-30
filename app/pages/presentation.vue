<template>
  <div class="presentation">
    <div class="lang-switch text-end mb-4">
      <button
          v-for="lang in ['en', 'ru']"
          :key="lang"
          :class="{ active: locale === lang }"
          @click="locale = lang"
          class="btn btn-sm me-2"
      >
        {{ lang.toUpperCase() }}
      </button>
    </div>

    <Slide
        v-for="(slide, index) in slides"
        :key="index"
        v-bind="slide"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import slidesEn from '@/data/slides-en'
import slidesRu from '@/data/slides-ru'

const locale = ref('en')

const slides = computed(() => locale.value === 'en' ? slidesEn : slidesRu)
</script>

<style lang="scss" scoped>
.lang-switch {
  button {
    background: transparent;
    border: 2px solid var(--cool-gray);
    color: var(--cool-gray);
    font-weight: 600;
    padding: 6px 16px;
    border-radius: 20px;
    transition: all 0.2s;
    &.active {
      background: var(--electric-teal);
      border-color: var(--electric-teal);
      color: var(--deep-navy);
    }
  }
}
</style>
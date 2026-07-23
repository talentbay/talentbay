<template>
  <nav class="row navbar">
    <div class="col">
      <a href="/" class="navbar-brand">
        <ship2 class="brand-icon" />
        <span class="brand-text">TalentBay DMCC</span>
      </a>
    </div>
    <div class="col text-center">
      <p class="title">{{ title }}</p>
    </div>
  </nav>
</template>

<script setup lang="ts">
import Ship2 from '~/components/icons/ship2.vue'

defineProps({
  title: String,
})
</script>

<style scoped lang="scss">
nav {
  text-align: center;
  margin-bottom: 28px;
}

.navbar-brand {
  display: flex;
  align-items: center;
}

.brand-icon {
  width: 2rem;
  height: 2rem;
  fill: var(--electric-teal) !important;
  display: inline-flex;
}

.brand-text {
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: var(--cloud-white);
  margin-left: 8px;
}

.title {
  color: #94a3b8;
  font-size: 1.05rem;
  margin: 0;
}
</style>

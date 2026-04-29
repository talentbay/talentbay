<template>
  <span class="logo-primary">
    <ship2 />
    <h1>TalentBay</h1>
  </span>
</template>

<script setup lang="ts">
import Ship2 from "~/components/icons/ship2.vue"
</script>

<style scoped lang="scss">
.logo-primary {
  display: inline-flex;
  align-items: baseline;
  color: var(--color-primary);
  svg {
    width: calc(1.375rem + 1vw);;
    height: calc(1.375rem + 1vw);
    fill: var(--color-primary);
  }
}
</style>
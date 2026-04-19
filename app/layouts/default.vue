<template>
  <article class="container">
    <Top></Top>
    <slot></slot>
  </article>
</template>

<script setup lang="ts">
import Top from '~/components/top.vue'
</script>

<style scoped lang="scss">
.container {
  max-width: 100% !important;
}
</style>
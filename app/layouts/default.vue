<template>
  <article class="container">
    <nav-bar></nav-bar>
    <slot></slot>
  </article>
</template>

<script setup lang="ts">
import NavBar from '~/components/navbar.vue'
</script>

<style scoped lang="scss">
.container {
  max-width: 100% !important;
}
</style>
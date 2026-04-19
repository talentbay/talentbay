<template>
  <article class="container">
    <Top></Top>
    <div class="row contents">
      <div class="col-1 menu">
        <admin-nav />
      </div>
      <div class="col">
        <div class="row justify-content-center">
          <div class="col text-center">
            <Admin class="admin-logo" />
            <h3>GOD MODE</h3>
          </div>
        </div>
        <slot></slot>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import Top from '~/components/top.vue'
import AdminNav from "~/components/admin-nav.vue";
import Admin from "~/components/icons/admin.vue";
</script>

<style scoped lang="scss">
.container {
  max-width: 100% !important;
  height: 100vh;
}
.admin-logo {
  width: 5rem;
  height: 5rem;
  fill: $app-accent-color;
}
h3 {
  color: $app-accent-color;
  margin-bottom: 2rem;
}
.contents {
  height: 90%;
}
.menu {
  padding-left: 0;
}
</style>
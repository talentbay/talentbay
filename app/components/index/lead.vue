<template>
  <section class="row">
    <div class="col text-center">
      <h1>Work from anywhere.</h1>
      <h3>We'll help with relocation and paperwork.</h3>
      <login class="login-btns" color="#00674F"></login>
    </div>
  </section>
</template>

<script setup lang="ts">
import Login from '~/components/login.vue'

</script>

<style scoped lang="scss">
section {
  min-height: 80vh;
  background-size: cover !important;
  background: url('./section1.svg') no-repeat center;
  align-items: center;
  justify-content: center;
  h1 {
    font-weight: 900;
    margin-top: 7vh;
  }
  .login-btns {
    margin-top: 5vh;
  }
}
</style>
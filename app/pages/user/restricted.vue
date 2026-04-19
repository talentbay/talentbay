<template>
  <div class="row justify-content-center align-items-center error">
    <div class="col text-center">
      <h1 class="error-code text-danger">401</h1>
      <p>Please login to continue. <a href="#" @click="goBack">Go back</a>.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped lang="scss">
article {
  height: 100vh;
  .error {
    height: 84.7vh;
    h1.error-code {
      font-size: calc(1.375rem + 7vw);
    }
  }
}
</style>
<template>
  <div class="row">
    <div class="col">
      <code>
        {{ user }}
      </code>
    </div>
  </div>
</template>

<script setup lang="ts">
const { loggedIn, user, session, fetch: refreshSession, clear, openInPopup } = useUserSession()
definePageMeta({
  middleware: 'auth'
})
</script>

<style scoped lang="scss">

</style>
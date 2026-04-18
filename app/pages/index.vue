<template>
  <article class="container">
    <Top></Top>
    <div class="row">
      <div class="col">This is text</div>
      <div class="col">{{ text.data }}</div>
    </div>
    <div class="row">
      <div class="col">
        <code>
          {{ user }}
        </code>
      </div>
    </div>
    <login></login>
  </article>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'
import Top from '~/components/top.vue'
import Login from '~/components/login.vue'

let text = ref(await axios.get('/api/test'))
const { loggedIn, user, session, fetch: refreshSession, clear, openInPopup } = useUserSession()

</script>

<style lang="scss" scoped>
.container {
  max-width: 100% !important;
}
</style>
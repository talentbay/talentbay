<template>
  <div>
    <Lead></Lead>
    Logged in: {{user}}
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'
import Lead from '~/components/index/lead.vue'

let text = ref(await axios.get('/api/test'))
const { loggedIn, user, session, fetch: refreshSession, clear, openInPopup } = useUserSession()

</script>

<style lang="scss" scoped>
</style>
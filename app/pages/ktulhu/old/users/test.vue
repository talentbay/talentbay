<template>
  <div class="row row justify-content-center align-items-center text-center">
    <div class="row justify-content-center text-center">
      <div class="col">
        <h4>Log-in as test user</h4>
      </div>
    </div>
    <div class="row justify-content-center text-center">
      <div class="col">
        <input v-model="data.providerID" type="text" placeholder="ID" />
        <input v-model="data.password" type="password" placeholder="Password" />
        <button class="btn btn-outline-dark" @click="login">Login</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from "axios";

definePageMeta({
  layout: 'admin',
})

const data = {
  providerID: '',
  password: '',
}

async function login() {
  await axios.post("/api/v1/auth/test", data)
}
</script>

<style scoped lang="scss">
input {
  display: flex;
  margin: 0.5rem auto;
  border-radius: .25rem;
  padding: .25rem;
  border-color: $app-accent-color;
}
</style>
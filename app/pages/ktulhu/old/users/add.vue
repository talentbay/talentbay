<template>
  <div class="row">
    <div class="col">
      <p>Role:
        <select v-model="user.role">
          <option value="USER">USER</option>
          <option value="MEMBER">MEMBER</option>
          <option value="ORG">ORG</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </p>
      <p>Name: <input type="text" v-model="user.name"></p>
      <p>Email: <input type="text" v-model="user.email"></p>
      <p>Password: <input type="password" v-model="user.password"></p>
      <p>Provider: <input type="text" v-model="user.provider"></p>
      <p>ProviderID: <input type="text" v-model="user.providerID"></p>
      <button @click="add">Add</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  authRole: 'ADMIN'
})

let user = ref({
  role: 'USER',
  name: null,
  email: 'test@pure',
  provider: 'PURE',
  providerID: Date.now(),
  password: null,
})

async function add() {
  await axios.post(`/api/v1/admin/users/add`, user.value)
}
</script>

<style scoped lang="scss">

</style>
<template>
  <div class="row">
    <div class="col">
      <p>ID: {{ user.id }}</p>
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
      <p>Provider: <input type="text" v-model="user.provider"></p>
      <p>ProviderID: <input type="text" v-model="user.providerID"></p>
      <p>Password: <input type="text" v-model="user.password"></p>
      <p>createdAt: {{ user.createdAt }}</p>
      <button @click="update">Update</button>
      <button @click="del">Delete</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { diff } from '~/components/utils/global'

const route = useRoute()
const id = route.params.id
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  authRole: 'ADMIN'
})

let user = ref(await axios.get(`/api/v1/admin/users/${id}`)).value.data
let userBase = {...user}

async function update() {
  await axios.patch(`/api/v1/admin/users/${id}`, diff(userBase, user))
}

async function del() {
  await axios.delete(`/api/v1/admin/users/${id}`)
}
</script>

<style scoped lang="scss">

</style>
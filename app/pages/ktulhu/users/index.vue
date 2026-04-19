<template>
  <div class="row">
    <div class="row justify-content-center">
      <div class="col text-center">
        <div class="search-input">
          <input type="email" placeholder="E-mail" />
          <Search />
        </div>
      </div>
    </div>
    <div class="row">
        <div class="col">
            <table class="table table-hover">
              <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Role</th>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Provider</th>
                <th scope="col">ProviderID</th>
                <th scope="col">createdAt</th>
                <th scope="col">#</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="user in users" @click="goTo(user.id)">
                <td>{{ user.id }}</td>
                <td>{{ user.role }}</td>
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.provider }}</td>
                <td>{{ user.providerID }}</td>
                <td>{{ user.createdAt }}</td>
                <td>
                  <a href="#">
                    <Edit />
                  </a>
                  <a href="#">
                    <Delete />
                  </a>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import Edit from '~/components/icons/edit.vue'
import Delete from '~/components/icons/delete.vue'
import Search from "~/components/icons/search.vue";

definePageMeta({
  layout: 'admin',
})

let users = ref(await axios.get('/api/admin/users/list')).value.data
const router = useRouter()

function goTo(id: number) {
  router.push(`/ktulhu/users/${id}`)
}
</script>

<style scoped lang="scss">
.search-input {
  position: relative;
  input {
    width: 100%;
    border-radius: 0.3rem;
    border-color: $app-accent-color;
    padding-left: 1rem;
  }
  svg {
    fill: $app-accent-color;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 1rem;
    width: 1em;
    height: 1em;
    cursor: pointer;
  }
}
.table {
  td {
    svg {
      height: 1rem;
      width: 1rem;
    }
  }
}
</style>
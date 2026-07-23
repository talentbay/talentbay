<template>
  <div class="users-page">
    <div class="page-header">
      <h1 class="page-title">Users</h1>
      <button class="btn-teal" @click="showModal = true">+ Add User</button>
    </div>

    <div class="filters">
      <input type="text" placeholder="Search users..." class="filter-input" v-model="search" />
      <select class="filter-select" v-model="roleFilter">
        <option value="">All Roles</option>
        <option value="job_seeker">Job Seeker</option>
        <option value="employer">Employer</option>
        <option value="admin">Admin</option>
      </select>
    </div>

    <div class="table-card">
      <DataTable :columns="['Name', 'Email', 'Role', 'Status', 'Joined']" :rows="filteredUsers">
        <template #actions="{ row, index }">
          <button class="action-link" @click="editUser(index)">Edit</button>
          <button class="action-link danger" @click="deleteUser(index)">Delete</button>
        </template>
      </DataTable>
    </div>

    <UserModal v-if="showModal" @close="showModal = false" @save="handleSave" :user="editingUser" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  authRole: 'ADMIN',
})

const search = ref('')
const roleFilter = ref('')
const showModal = ref(false)
const editingUser = ref(null)

const users = ref([
  ['John Doe', 'john@example.com', 'Job Seeker', 'Active', '2026-01-15'],
  ['TechCorp Ltd', 'hr@techcorp.com', 'Employer', 'Active', '2025-11-20'],
  ['Maria S.', 'maria@mail.com', 'Job Seeker', 'Pending', '2026-04-01'],
  ['CryptoPay Inc', 'admin@cryptopay.io', 'Employer', 'Active', '2025-09-10'],
])

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const matchSearch = u[0].toLowerCase().includes(search.value.toLowerCase()) ||
        u[1].toLowerCase().includes(search.value.toLowerCase())
    const matchRole = !roleFilter.value || u[2].toLowerCase().replace(' ', '_') === roleFilter.value
    return matchSearch && matchRole
  })
})

const editUser = (idx) => {
  editingUser.value = { index: idx, ...users.value[idx] }
  showModal.value = true
}

const deleteUser = (idx) => {
  users.value.splice(idx, 1)
}

const handleSave = (data) => {
  if (data.index !== undefined) {
    users.value[data.index] = [data.name, data.email, data.role, data.status, users.value[data.index][4]]
  } else {
    users.value.push([data.name, data.email, data.role, 'Active', new Date().toISOString().split('T')[0]])
  }
  showModal.value = false
  editingUser.value = null
}
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 1.8rem;
  color: var(--deep-navy);
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-input,
.filter-select {
  padding: 10px 16px;
  border: 1px solid var(--light-gray);
  border-radius: 10px;
  font-size: 0.9rem;
  background: white;
  outline: none;

  &:focus {
    border-color: var(--electric-teal);
  }
}

.table-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--light-gray);
}

.action-link {
  background: none;
  border: none;
  color: var(--electric-teal);
  cursor: pointer;
  font-weight: 500;
  padding: 4px 8px;

  &.danger {
    color: #ef4444;
  }

  &:hover {
    text-decoration: underline;
  }
}

.btn-teal {
  background: var(--electric-teal);
  border: none;
  color: var(--deep-navy);
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  padding: 12px 24px;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 8px 25px rgba(0, 212, 170, 0.3);
  }
}
</style>

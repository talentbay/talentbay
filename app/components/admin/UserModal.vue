<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <h3>{{ user ? 'Edit User' : 'Add User' }}</h3>
      <div class="form-group">
        <label>Name</label>
        <input v-model="form.name" type="text" />
      </div>
      <div class="form-group">
        <label>Email</label>
        <input v-model="form.email" type="email" />
      </div>
      <div class="form-group">
        <label>Role</label>
        <select v-model="form.role">
          <option value="Job Seeker">Job Seeker</option>
          <option value="Employer">Employer</option>
          <option value="Admin">Admin</option>
        </select>
      </div>
      <div class="form-group" v-if="user">
        <label>Status</label>
        <select v-model="form.status">
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" @click="$emit('close')">Cancel</button>
        <button class="btn-teal" @click="$emit('save', { ...form, index: user?.index })">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'

const props = defineProps({ user: Object })
defineEmits(['close', 'save'])

const form = reactive({
  name: '',
  email: '',
  role: 'Job Seeker',
  status: 'Active'
})

onMounted(() => {
  if (props.user) {
    form.name = props.user[0] || ''
    form.email = props.user[1] || ''
    form.role = props.user[2] || 'Job Seeker'
    form.status = props.user[3] || 'Active'
  }
})
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 37, 64, 0.6);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 480px;

  h3 {
    font-family: 'Exo 2', sans-serif;
    font-weight: 700;
    color: var(--deep-navy);
    margin-bottom: 24px;
  }
}

.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--deep-navy);
    margin-bottom: 6px;
  }

  input,
  select {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--light-gray);
    border-radius: 10px;
    font-size: 0.9rem;
    outline: none;

    &:focus {
      border-color: var(--electric-teal);
    }
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-cancel {
  background: #f1f5f9;
  border: none;
  padding: 10px 24px;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
}

.btn-teal {
  background: var(--electric-teal);
  border: none;
  color: var(--deep-navy);
  font-weight: 700;
  padding: 10px 24px;
  border-radius: 50px;
  cursor: pointer;
}
</style>
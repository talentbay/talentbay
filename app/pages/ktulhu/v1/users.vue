<script setup lang="ts">
type AdminUser = {
  id: number
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  avatarUrl: string | null
  createdAt: string
  lastLoginAt: string | null
}

type AdminUsersResponse = {
  items: AdminUser[]
  total: number
}

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  authRole: 'ADMIN',
})

const search = ref('')
const role = ref<'all' | AdminUser['role']>('all')

const roleItems = [
  { label: 'All roles', value: 'all' },
  { label: 'Users', value: 'USER' },
  { label: 'Admins', value: 'ADMIN' },
]

const query = computed(() => ({
  q: search.value || undefined,
  role: role.value === 'all' ? undefined : role.value,
}))

const { data, status, error } = await useFetch<AdminUsersResponse>(
  '/api/v1/admin/users',
  { query },
)

const dateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
</script>

<template>
  <section aria-labelledby="admin-users-title">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 id="admin-users-title" class="text-3xl font-bold text-highlighted">Users</h1>
        <p class="mt-2 text-sm text-muted">Read-only OAuth account registry for the MVP.</p>
      </div>
      <UBadge :label="`${data?.total ?? 0} records`" color="neutral" variant="soft" />
    </div>

    <div class="mt-6 flex flex-wrap gap-3">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search name or email"
        aria-label="Search users"
        class="w-full sm:w-80"
      />
      <USelect
        v-model="role"
        :items="roleItems"
        value-key="value"
        aria-label="Filter by role"
        class="w-44"
      />
    </div>

    <div v-if="status === 'pending' && !data" class="mt-6 space-y-3">
      <USkeleton v-for="index in 5" :key="index" class="h-20 rounded-lg" />
    </div>

    <UAlert
      v-else-if="error"
      class="mt-6"
      color="error"
      variant="soft"
      icon="i-lucide-database-zap"
      title="User data unavailable"
      description="Connect the PostgreSQL database before using the user registry."
    />

    <div v-else-if="data?.items.length" class="mt-6 overflow-x-auto rounded-lg border border-default bg-elevated">
      <table class="w-full min-w-[720px] text-left text-sm">
        <thead class="border-b border-default bg-muted text-xs font-semibold uppercase text-muted">
          <tr>
            <th class="px-4 py-3">User</th>
            <th class="px-4 py-3">Role</th>
            <th class="px-4 py-3">Created</th>
            <th class="px-4 py-3">Last sign-in</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="account in data.items" :key="account.id">
            <td class="px-4 py-4">
              <div class="flex items-center gap-3">
                <UAvatar
                  :src="account.avatarUrl || undefined"
                  :alt="account.name"
                  :text="account.name.slice(0, 2).toUpperCase()"
                  size="sm"
                />
                <div>
                  <p class="font-semibold text-highlighted">{{ account.name }}</p>
                  <p class="mt-0.5 text-xs text-muted">{{ account.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-4">
              <UBadge :label="account.role" color="neutral" variant="soft" />
            </td>
            <td class="px-4 py-4 text-default">{{ dateFormatter.format(new Date(account.createdAt)) }}</td>
            <td class="px-4 py-4 text-default">
              {{ account.lastLoginAt ? dateFormatter.format(new Date(account.lastLoginAt)) : 'Never' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UEmpty
      v-else
      class="mt-6"
      icon="i-lucide-users"
      title="No users found"
      description="OAuth accounts will appear here after first sign-in."
    />
  </section>
</template>

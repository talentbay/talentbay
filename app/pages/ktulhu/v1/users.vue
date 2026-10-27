<script setup lang="ts">
type AdminUser = {
  id: number
  name: string
  email: string | null
  role: 'USER' | 'ADMIN'
  avatarUrl: string | null
  createdAt: string
  lastLoginAt: string | null
}

type AdminUsersResponse = {
  items: AdminUser[]
  total: number
  nextCursor: string | null
}

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  authRole: 'ADMIN',
})

const route = useRoute()
const router = useRouter()
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
watch(() => route.query.q, value => { search.value = typeof value === 'string' ? value : '' })
const role = computed({
  get: () => ['USER', 'ADMIN'].includes(String(route.query.role)) ? String(route.query.role) as AdminUser['role'] : 'all',
  set: value => { void router.push({ query: { ...route.query, role: value === 'all' ? undefined : value, before: undefined } }) },
})
function submitSearch() { return router.push({ query: { ...route.query, q: search.value.trim() || undefined, before: undefined } }) }

const roleItems = [
  { label: 'All roles', value: 'all' },
  { label: 'Users', value: 'USER' },
  { label: 'Admins', value: 'ADMIN' },
]

const query = computed(() => ({
  q: typeof route.query.q === 'string' ? route.query.q : undefined,
  role: role.value === 'all' ? undefined : role.value,
  before: typeof route.query.before === 'string' ? route.query.before : undefined,
}))

const { data, status, error, refresh } = await useAccountResource<AdminUsersResponse>(
  'admin-users',
  '/api/v1/admin/users',
  query,
)

const dateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
</script>

<template>
  <section class="min-w-0" aria-labelledby="admin-users-title">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 id="admin-users-title" class="scroll-mt-28 text-3xl font-bold text-highlighted">Users</h1>
      </div>
      <UBadge :label="`${data?.total ?? 0} records`" color="neutral" variant="soft" />
    </div>

    <form class="mt-6 flex flex-wrap gap-3" role="search" @submit.prevent="submitSearch">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search name or email"
        aria-label="Search users"
        maxlength="120"
        class="w-full sm:w-80"
      />
      <UButton type="submit" icon="i-lucide-search" label="Search" :disabled="status === 'pending'" />
      <USelect
        v-model="role"
        :items="roleItems"
        value-key="value"
        aria-label="Filter by role"
        class="w-44"
      />
    </form>

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
      description="Reload the list or restart from the newest accounts."
    ><template #actions><UButton label="Retry" icon="i-lucide-refresh-cw" color="error" variant="outline" @click="refresh()" /></template></UAlert>

    <div v-else-if="data?.items.length" role="region" aria-label="User registry" tabindex="0" class="mt-6 overflow-x-auto rounded-lg border border-default bg-elevated focus-visible:outline-2 focus-visible:outline-primary">
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
      description="No accounts match the current filters."
    />
    <p v-if="data && !error" class="mt-4 text-sm text-muted">{{ data.items.length }} of {{ data.total }} accounts · newest first</p>
    <nav class="mt-4 flex flex-wrap gap-3" aria-label="User pages">
      <UButton v-if="route.query.before" :to="{ query: { ...route.query, before: undefined }, hash: '#admin-users-title' }" label="Newest users" icon="i-lucide-arrow-up" color="neutral" variant="outline" :disabled="status === 'pending'" />
      <UButton v-if="!error && data?.nextCursor" :to="{ query: { ...route.query, before: data.nextCursor }, hash: '#admin-users-title' }" label="Older users" trailing-icon="i-lucide-arrow-right" color="neutral" variant="outline" :disabled="status === 'pending'" />
    </nav>
  </section>
</template>

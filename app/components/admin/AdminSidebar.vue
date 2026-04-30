<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-brand">
      <component :is="getIcon('zap')" class="brand-icon" />
      <span v-if="!isCollapsed" class="brand-text">TalentBay Admin</span>
    </div>

    <nav class="sidebar-nav">
      <NuxtLink to="/admin" class="nav-item" :class="{ active: $route.path === '/admin' }">
        <component :is="getIcon('layout-dashboard')" />
        <span v-if="!isCollapsed">Dashboard</span>
      </NuxtLink>

      <NuxtLink to="/admin/users" class="nav-item" :class="{ active: $route.path.startsWith('/admin/users') }">
        <component :is="getIcon('users')" />
        <span v-if="!isCollapsed">Users</span>
      </NuxtLink>

      <NuxtLink to="/admin/organizations" class="nav-item" :class="{ active: $route.path.startsWith('/admin/organizations') }">
        <component :is="getIcon('building')" />
        <span v-if="!isCollapsed">Organizations</span>
      </NuxtLink>

      <NuxtLink to="/admin/jobs" class="nav-item" :class="{ active: $route.path.startsWith('/admin/jobs') }">
        <component :is="getIcon('briefcase')" />
        <span v-if="!isCollapsed">Jobs</span>
      </NuxtLink>

      <NuxtLink to="/admin/tokens" class="nav-item" :class="{ active: $route.path.startsWith('/admin/tokens') }">
        <component :is="getIcon('coins')" />
        <span v-if="!isCollapsed">Tokens</span>
      </NuxtLink>

      <NuxtLink to="/admin/reports" class="nav-item" :class="{ active: $route.path.startsWith('/admin/reports') }">
        <component :is="getIcon('bar-chart-3')" />
        <span v-if="!isCollapsed">Reports</span>
      </NuxtLink>

      <NuxtLink to="/admin/settings" class="nav-item" :class="{ active: $route.path.startsWith('/admin/settings') }">
        <component :is="getIcon('settings')" />
        <span v-if="!isCollapsed">Settings</span>
      </NuxtLink>
    </nav>

    <div class="sidebar-footer">
      <button class="collapse-btn" @click="isCollapsed = !isCollapsed">
        <component :is="getIcon(isCollapsed ? 'chevron-right' : 'chevron-left')" />
      </button>
      <NuxtLink to="/" class="nav-item">
        <component :is="getIcon('log-out')" />
        <span v-if="!isCollapsed">Exit Admin</span>
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { getIcon } from '@/components/utils/global.ts'

const isCollapsed = ref(false)
</script>

<style lang="scss" scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 260px;
  background: var(--deep-navy);
  display: flex;
  flex-direction: column;
  z-index: 200;
  transition: width 0.3s;
  overflow-x: hidden;

  &.collapsed {
    width: 72px;
  }
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .brand-icon {
    color: var(--electric-teal);
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .brand-text {
    font-family: 'Exo 2', sans-serif;
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--cloud-white);
    white-space: nowrap;
  }
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 10px;
  color: #94a3b8;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;

  svg {
    width: 1.3rem;
    height: 1.3rem;
    flex-shrink: 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--cloud-white);
  }

  &.active {
    background: rgba(0, 212, 170, 0.15);
    color: var(--electric-teal);
  }
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.collapse-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--cloud-white);
  }
}

@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);

    &.collapsed {
      transform: translateX(0);
      width: 260px;
    }
  }
}
</style>
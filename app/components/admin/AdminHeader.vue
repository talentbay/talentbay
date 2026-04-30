<template>
  <header class="admin-header">
    <button class="menu-btn" @click="toggleSidebar">
      <component :is="getIcon('menu')" />
    </button>

    <div class="header-search">
      <component :is="getIcon('search')" class="search-icon" />
      <input type="text" placeholder="Search..." class="search-input" />
    </div>

    <div class="header-actions">
      <button class="action-btn">
        <component :is="getIcon('bell')" />
        <span class="badge">3</span>
      </button>
      <div class="user-menu">
        <div class="avatar">AD</div>
        <span class="user-name">Admin</span>
        <component :is="getIcon('chevron-down')" class="chevron" />
      </div>
    </div>
  </header>
</template>

<script setup>
import { getIcon } from '@/components/utils/global.ts'

const toggleSidebar = () => {
  // В реальном проекте — emit или store
}
</script>

<style lang="scss" scoped>
.admin-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 32px;
  background: white;
  border-bottom: 1px solid var(--light-gray);
  position: sticky;
  top: 0;
  z-index: 100;
}

.menu-btn {
  display: none;
  background: none;
  border: none;
  color: var(--deep-navy);
  cursor: pointer;
  padding: 8px;
}

.header-search {
  flex: 1;
  max-width: 400px;
  position: relative;

  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--cool-gray);
    width: 1.1rem;
  }

  .search-input {
    width: 100%;
    padding: 10px 16px 10px 42px;
    border: 1px solid var(--light-gray);
    border-radius: 10px;
    font-size: 0.9rem;
    background: #f8fafc;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
      border-color: var(--electric-teal);
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.action-btn {
  position: relative;
  background: none;
  border: none;
  color: var(--cool-gray);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;

  &:hover {
    background: #f1f5f9;
  }

  .badge {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #ef4444;
    color: white;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 10px;

  &:hover {
    background: #f1f5f9;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--electric-teal);
    color: var(--deep-navy);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.85rem;
  }

  .user-name {
    font-weight: 600;
    color: var(--deep-navy);
  }

  .chevron {
    color: var(--cool-gray);
    width: 1rem;
  }
}

@media (max-width: 1024px) {
  .menu-btn {
    display: block;
  }
}
</style>
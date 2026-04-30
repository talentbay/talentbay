<template>
  <div class="stat-card">
    <div class="stat-header">
      <span class="stat-label">{{ label }}</span>
      <div class="stat-icon">
        <component :is="getIcon(icon)" />
      </div>
    </div>
    <div class="stat-value">{{ value }}</div>
    <div class="stat-change" :class="trend">
      <component :is="getIcon(trend === 'up' ? 'trending-up' : 'trending-down')" />
      {{ change }}
    </div>
  </div>
</template>

<script setup>
import { getIcon } from '~/components/utils/global.ts'

defineProps({
  icon: String,
  label: String,
  value: String,
  change: String,
  trend: String
})
</script>

<style lang="scss" scoped>
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--light-gray);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--cool-gray);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(0, 212, 170, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--electric-teal);
}

.stat-value {
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 2rem;
  color: var(--deep-navy);
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  margin-top: 8px;

  svg { width: 1rem; }

  &.up { color: #10b981; }
  &.down { color: #ef4444; }
}
</style>
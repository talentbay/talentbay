<template>
  <div class="admin-layout">
    <AdminSidebar />
    <div class="admin-main">
      <AdminHeader />
      <main class="admin-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f1f5f9;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 260px;
  transition: margin-left 0.3s;
}

.admin-content {
  flex: 1;
  padding: 32px;
}

@media (max-width: 1024px) {
  .admin-main {
    margin-left: 0;
  }

  .admin-content {
    padding: 20px;
  }
}
</style>
<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-card">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--deep-navy);
  background-image:
      radial-gradient(ellipse at 20% 30%, rgba(0, 212, 170, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 70%, rgba(20, 68, 107, 0.3) 0%, transparent 50%),
      url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q10 45 20 50 T40 50 T60 50 T80 50 T100 50 M50 0 Q45 10 50 20 T50 40 T50 60 T50 80 T50 100' stroke='%2300D4AA' stroke-width='0.3' fill='none' opacity='0.08'/%3E%3C/svg%3E");
  padding: 24px;
}

.auth-container {
  width: 100%;
  max-width: 480px;
}

.auth-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
}

@media (max-width: 576px) {
  .auth-card {
    padding: 32px 24px;
  }
}
</style>
<template>
  <nav class="navbar navbar-expand-lg">
    <div class="container">
      <a href="/" class="navbar-brand">
        <ship2 class="brand-icon" />
        <span class="brand-text">TalentBay</span>
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto align-items-lg-center">
          <li class="nav-item">
            <NuxtLink to="/presentation"
                      class="nav-link"
                      v-if="route.path !== '/presentation'">Presentation
            </NuxtLink>
          </li>
          <template v-if="route.path === '/'">
            <li class="nav-item">
              <a href="#features" class="nav-link">Features</a>
            </li>
            <li class="nav-item">
              <a href="#how-it-works" class="nav-link">How It Works</a>
            </li>
            <li class="nav-item">
              <a href="#tokenomics" class="nav-link">Tokenomics</a>
            </li>
          </template>

          <li class="nav-item ms-lg-3">
            <a href="#" class="btn-teal btn-sm">Join Pre-ICO</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import Ship2 from '~/components/icons/ship2.vue';

const route = useRoute()
const { clear, loggedIn } = useUserSession()
</script>

<style scoped lang="scss">
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--light-gray);
  padding: 16px 0;
  position: sticky;
  top: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 100;

  .navbar-brand {
    display: flex;
    align-items: center;
  }

  .brand-icon {
    width: 2rem;
    height: 2rem;
    fill: var(--electric-teal) !important;
    display: inline-flex;
  }

  .brand-text {
    font-family: 'Exo 2', sans-serif;
    font-weight: 700;
    font-size: 1.5rem;
    color: var(--deep-navy);
    margin-left: 8px;
  }

  .nav-link {
    color: var(--cool-gray);
    font-weight: 500;
    padding: 8px 16px;
    transition: color 0.2s;

    &:hover {
      color: var(--electric-teal);
    }
  }
}

.btn-teal {
  background: linear-gradient(90deg, var(--electric-teal), var(--electric-teal-deep));
  border: none;
  color: var(--deep-navy);
  font-weight: 700;
  padding: 14px 36px;
  border-radius: 50px;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 8px 30px rgba(0, 212, 170, 0.4);
    transform: translateY(-2px);
    color: var(--deep-navy);
  }

  &.btn-lg {
    padding: 18px 48px;
    font-size: 1.1rem;
  }

  &.btn-sm {
    padding: 8px 20px;
    font-size: 0.9rem;
  }
}
</style>
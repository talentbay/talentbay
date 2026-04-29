<template>
  <header class="row">
    <div class="col-3"><a href="/" class="logo"><logo /></a></div>
    <div class="col align-content-center text-end">
      <a href="/whitepaper">Whitepaper</a>
    </div>
    <div class="col-2 text-end">
      <button class="header-btn" data-bs-toggle="modal" data-bs-target="#loginModal" v-if="!loggedIn"><login-icon /></button>
      <button class="header-btn" v-if="loggedIn"><a href="/user/profile"><profile-icon /></a></button>
      <button class="header-btn" @click="clear" v-if="loggedIn"><logout-icon /></button>
    </div>
    <div class="modal" id="loginModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Login</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <login />
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import LoginIcon from '~/components/icons/login.vue'
import LogoutIcon from '~/components/icons/logout.vue'
import ProfileIcon from '~/components/icons/profile.vue'
import Login from './login.vue'
import Logo from '~/components/logo.vue'

const { clear, loggedIn } = useUserSession()
</script>

<style scoped lang="scss">
header {
  min-height: 2vh;
  overflow: hidden;
  .col-2 {
    &:last-of-type {
      button {
        margin: 0;
        border: none;
        padding: .5rem;
        background: transparent;
      }
      svg {
        height: 1rem;
        width: 1rem;
      }
    }
  }

  a {
    color: var(--color-primary);
    &:hover {
      color: var(--color-accent);
    }
  }
}
.header-btn {
  margin: 0;
  border: none;
  padding: .5rem;
  background: transparent;
  svg {
    height: 1rem;
    width: 1rem;
  }
}

.logo {
  color: black;
  text-decoration: none !important;
}
</style>
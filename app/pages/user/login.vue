<template>
  <div class="login-page">
    <AuthNav title="Welcome back" />

    <!-- Tabs -->
    <div class="auth-tabs">
      <button
          :class="{ active: activeTab === 'email' }"
          @click="activeTab = 'email'"
      >
        <component :is="getIcon('mail')" />
        Email
      </button>
      <button
          :class="{ active: activeTab === 'wallet' }"
          @click="activeTab = 'wallet'"
      >
        <component :is="getIcon('wallet')" />
        Wallet
      </button>
    </div>

    <!-- Email Login -->
    <form v-if="activeTab === 'email'" @submit.prevent="handleEmailLogin" class="auth-form">
      <div class="form-group">
        <label>Email</label>
        <div class="input-wrapper">
          <component :is="getIcon('mail')" class="input-icon" />
          <input
              v-model="emailForm.email"
              type="email"
              placeholder="you@example.com"
              required
          />
        </div>
      </div>

      <div class="form-group">
        <label>Password</label>
        <div class="input-wrapper">
          <component :is="getIcon('lock')" class="input-icon" />
          <input
              v-model="emailForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
          />
          <button type="button" class="toggle-password" @click="showPassword = !showPassword">
            <component :is="getIcon(showPassword ? 'eye-off' : 'eye')" />
          </button>
        </div>
      </div>

      <div class="form-options">
        <label class="checkbox-label">
          <input type="checkbox" v-model="emailForm.remember" />
          <span class="checkmark"></span>
          Remember me
        </label>
        <NuxtLink to="/reset-password" class="forgot-link">Forgot password?</NuxtLink>
      </div>

      <button type="submit" class="btn-submit" :disabled="loading">
        <span v-if="!loading">Sign In</span>
        <span v-else class="spinner"></span>
      </button>
    </form>

    <!-- Wallet Login -->
    <div v-if="activeTab === 'wallet'" class="auth-form">
      <p class="wallet-info">
        Connect your Web3 wallet to sign in securely without a password.
      </p>

      <div class="wallet-options">
        <button class="wallet-btn" @click="connectWallet('metamask')">
<!--          <img src="/wallets/metamask.svg" alt="MetaMask" class="wallet-icon" />-->
          MetaMask
        </button>
        <button class="wallet-btn" @click="connectWallet('walletconnect')">
<!--
          <img src="/wallets/walletconnect.svg" alt="WalletConnect" class="wallet-icon" />
-->
          WalletConnect
        </button>
        <button class="wallet-btn" @click="connectWallet('coinbase')">
<!--
          <img src="/wallets/coinbase.svg" alt="Coinbase" class="wallet-icon" />
-->
          Coinbase Wallet
        </button>
      </div>

      <p class="wallet-note">
        By connecting your wallet, you agree to our
        <NuxtLink to="/terms">Terms of Service</NuxtLink>
      </p>
    </div>

    <div class="auth-footer">
      <p>Don't have an account? <NuxtLink to="/user/register" class="link">Sign Up</NuxtLink></p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { getIcon } from '@/components/utils/global.ts'
import AuthNav from "~/components/AuthNav.vue";

definePageMeta({ layout: 'auth' })

const activeTab = ref('email')
const showPassword = ref(false)
const loading = ref(false)

const emailForm = reactive({
  email: '',
  password: '',
  remember: false
})

const handleEmailLogin = async () => {
  loading.value = true
  // Имитация API-запроса
  await new Promise(r => setTimeout(r, 1500))
  loading.value = false
  navigateTo('/')
}

const connectWallet = async (wallet) => {
  loading.value = true
  await new Promise(r => setTimeout(r, 2000))
  loading.value = false
  // В реальном проекте — ethers.js / wagmi
  navigateTo('/')
}
</script>

<style lang="scss" scoped>
.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  margin-bottom: 12px;

  .logo-icon {
    color: var(--electric-teal);
    font-size: 1.8rem;
  }

  .logo-text {
    font-family: 'Exo 2', sans-serif;
    font-weight: 700;
    font-size: 1.8rem;
    color: var(--cloud-white);
  }
}

.auth-subtitle {
  color: #94a3b8;
  font-size: 1.05rem;
  margin: 0;
}

// Tabs
.auth-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 4px;

  button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #94a3b8;
    font-family: 'Exo 2', sans-serif;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s;

    svg {
      width: 1.1rem;
      height: 1.1rem;
    }

    &.active {
      background: rgba(0, 212, 170, 0.15);
      color: var(--electric-teal);
    }

    &:hover:not(.active) {
      color: var(--cloud-white);
    }
  }
}

// Form
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  label {
    display: block;
    font-weight: 600;
    font-size: 0.9rem;
    color: #cbd5e1;
    margin-bottom: 8px;
  }
}

.input-wrapper {
  position: relative;

  .input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 1.2rem;
    height: 1.2rem;
    color: #64748b;
  }

  input {
    width: 100%;
    padding: 14px 16px 14px 44px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: var(--cloud-white);
    font-family: 'Exo 2', sans-serif;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.3s;

    &::placeholder {
      color: #64748b;
    }

    &:focus {
      border-color: var(--electric-teal);
    }
  }
}

.toggle-password {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: var(--electric-teal);
  }
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 0.9rem;
  cursor: pointer;

  input {
    display: none;
  }
}

.forgot-link {
  color: var(--electric-teal);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

.btn-submit {
  background: var(--electric-teal);
  border: none;
  color: var(--deep-navy);
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 1.05rem;
  padding: 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    box-shadow: 0 8px 30px rgba(0, 212, 170, 0.3);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// Wallet
.wallet-info {
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 8px;
}

.wallet-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wallet-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  color: var(--cloud-white);
  font-family: 'Exo 2', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--electric-teal);
  }
}

.wallet-icon {
  width: 32px;
  height: 32px;
}

.wallet-note {
  color: #64748b;
  font-size: 0.85rem;
  margin-top: 16px;
  text-align: center;

  a {
    color: var(--electric-teal);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

// Footer
.auth-footer {
  text-align: center;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  p {
    color: #94a3b8;
    font-size: 0.95rem;
    margin: 0;
  }

  .link {
    color: var(--electric-teal);
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--deep-navy);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 576px) {
  .auth-card {
    padding: 28px 20px;
  }
}
</style>
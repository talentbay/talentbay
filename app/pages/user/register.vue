<template>
  <div class="register-page">
    <navbar />

    <!-- Steps -->
    <div class="steps-indicator">
      <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
        <div class="step-circle">1</div>
        <span>Account</span>
      </div>
      <div class="step-line" :class="{ filled: currentStep > 1 }"></div>
      <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
        <div class="step-circle">2</div>
        <span>Role</span>
      </div>
      <div class="step-line" :class="{ filled: currentStep > 2 }"></div>
      <div class="step" :class="{ active: currentStep >= 3 }">
        <div class="step-circle">3</div>
        <span>Profile</span>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="auth-form">
      <!-- Step 1: Account -->
      <template v-if="currentStep === 1">
        <div class="form-group">
          <label>Full Name</label>
          <div class="input-wrapper">
            <component :is="getIcon('user')" class="input-icon" />
            <input v-model="form.name" type="text" placeholder="John Doe" required />
          </div>
        </div>

        <div class="form-group">
          <label>Email</label>
          <div class="input-wrapper">
            <component :is="getIcon('mail')" class="input-icon" />
            <input v-model="form.email" type="email" placeholder="you@example.com" required />
          </div>
        </div>

        <div class="form-group">
          <label>Password</label>
          <div class="input-wrapper">
            <component :is="getIcon('lock')" class="input-icon" />
            <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Min. 8 characters"
                required
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              <component :is="getIcon(showPassword ? 'eye-off' : 'eye')" />
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>Confirm Password</label>
          <div class="input-wrapper">
            <component :is="getIcon('lock')" class="input-icon" />
            <input
                v-model="form.confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Repeat password"
                required
            />
          </div>
        </div>
      </template>

      <!-- Step 2: Role -->
      <template v-if="currentStep === 2">
        <div class="role-cards">
          <div
              class="role-card"
              :class="{ selected: form.role === 'job_seeker' }"
              @click="form.role = 'job_seeker'"
          >
            <div class="role-icon">
              <component :is="getIcon('user-plus')" />
            </div>
            <h3>Job Seeker</h3>
            <p>Find remote jobs worldwide, calculate relocation costs, get paid in crypto.</p>
          </div>

          <div
              class="role-card"
              :class="{ selected: form.role === 'employer' }"
              @click="form.role = 'employer'"
          >
            <div class="role-icon">
              <component :is="getIcon('building')" />
            </div>
            <h3>Employer</h3>
            <p>Hire global talent, access relocation analytics, get crypto-friendly badge.</p>
          </div>
        </div>
      </template>

      <!-- Step 3: Profile -->
      <template v-if="currentStep === 3">
        <div class="form-group">
          <label>Country</label>
          <select v-model="form.country" class="styled-select">
            <option value="">Select country</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="DE">Germany</option>
            <option value="PT">Portugal</option>
            <option value="AE">UAE</option>
          </select>
        </div>

        <div class="form-group" v-if="form.role === 'job_seeker'">
          <label>Primary Skills</label>
          <input v-model="form.skills" type="text" placeholder="e.g. Solidity, React, Python" />
        </div>

        <div class="form-group" v-if="form.role === 'employer'">
          <label>Company Name</label>
          <input v-model="form.company" type="text" placeholder="Your company name" />
        </div>

        <label class="checkbox-label">
          <input type="checkbox" v-model="form.agreed" required />
          <component :is="getIcon('check')" class="custom-check" />
          <span>I agree to the <NuxtLink to="/terms">Terms</NuxtLink> and <NuxtLink to="/privacy">Privacy Policy</NuxtLink></span>
        </label>
      </template>

      <!-- Navigation Buttons -->
      <div class="step-buttons">
        <button
            v-if="currentStep > 1"
            type="button"
            class="btn-back"
            @click="currentStep--"
        >
          <component :is="getIcon('arrow-left')" />
          Back
        </button>
        <button
            v-if="currentStep < 3"
            type="button"
            class="btn-next"
            @click="nextStep"
        >
          Continue
          <component :is="getIcon('arrow-right')" />
        </button>
        <button
            v-if="currentStep === 3"
            type="submit"
            class="btn-submit"
            :disabled="loading"
        >
          <span v-if="!loading">Create Account</span>
          <span v-else class="spinner"></span>
        </button>
      </div>
    </form>

    <div class="auth-footer">
      <p>Already have an account? <NuxtLink to="/login" class="link">Sign In</NuxtLink></p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { getIcon } from '@/components/utils/global.ts'

definePageMeta({ layout: 'auth' })

const currentStep = ref(1)
const showPassword = ref(false)
const loading = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'job_seeker',
  country: '',
  skills: '',
  company: '',
  agreed: false
})

const nextStep = () => {
  if (currentStep.value === 1 && (!form.name || !form.email || !form.password)) return
  if (currentStep.value === 2 && !form.role) return
  currentStep.value++
}

const handleSubmit = async () => {
  if (!form.agreed) return
  loading.value = true
  await new Promise(r => setTimeout(r, 2000))
  loading.value = false
  navigateTo('/login')
}
</script>

<style lang="scss" scoped>
// Импортируем стили из login.vue для auth-header, auth-form, input-wrapper
.auth-header {
  text-align: center;
  margin-bottom: 28px;
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

// Steps Indicator
.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;

  span {
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 500;
  }

  &.active span {
    color: var(--electric-teal);
  }

  &.completed span {
    color: var(--electric-teal);
  }
}

.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #64748b;
  transition: all 0.3s;

  .step.active & {
    border-color: var(--electric-teal);
    color: var(--electric-teal);
  }

  .step.completed & {
    background: var(--electric-teal);
    border-color: var(--electric-teal);
    color: var(--deep-navy);
  }
}

.step-line {
  width: 60px;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 8px 24px;

  &.filled {
    background: var(--electric-teal);
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

    &::placeholder { color: #64748b; }

    &:focus { border-color: var(--electric-teal); }
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

  &:hover { color: var(--electric-teal); }
}

.styled-select {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--cloud-white);
  font-family: 'Exo 2', sans-serif;
  font-size: 1rem;
  outline: none;
  cursor: pointer;
  appearance: none;

  option { background: var(--deep-navy); color: var(--cloud-white); }
}

// Role Cards
.role-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.role-card {
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: rgba(0, 212, 170, 0.3);
  }

  &.selected {
    border-color: var(--electric-teal);
    background: rgba(0, 212, 170, 0.08);
  }

  .role-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(0, 212, 170, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--electric-teal);
    margin: 0 auto 12px;
  }

  h3 {
    font-family: 'Exo 2', sans-serif;
    font-weight: 700;
    color: var(--cloud-white);
    margin-bottom: 8px;
  }

  p {
    font-size: 0.85rem;
    color: #94a3b8;
    line-height: 1.5;
    margin: 0;
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #94a3b8;
  font-size: 0.9rem;
  cursor: pointer;

  input { display: none; }

  a {
    color: var(--electric-teal);
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
}

.step-buttons {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-back {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--cloud-white);
  font-family: 'Exo 2', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.btn-next,
.btn-submit {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-next {
  background: var(--electric-teal);
  color: var(--deep-navy);

  &:hover {
    box-shadow: 0 8px 25px rgba(0, 212, 170, 0.3);
  }
}

.btn-submit {
  background: var(--electric-teal);
  color: var(--deep-navy);

  &:hover:not(:disabled) {
    box-shadow: 0 8px 30px rgba(0, 212, 170, 0.3);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// Footer
.auth-footer {
  text-align: center;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  p { color: #94a3b8; font-size: 0.95rem; margin: 0; }

  .link { color: var(--electric-teal); text-decoration: none; font-weight: 600; &:hover { text-decoration: underline; } }
}

.spinner {
  display: inline-block;
  width: 20px; height: 20px;
  border: 2px solid var(--deep-navy);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 576px) {
  .role-cards { grid-template-columns: 1fr; }
}
</style>
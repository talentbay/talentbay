<template>
  <Teleport to="body">
    <Transition name="gdpr">
      <div v-if="visible" class="gdpr-overlay">
        <div class="gdpr-banner">
          <div class="gdpr-content">
            <div class="gdpr-icon">
              <component :is="getIcon('shield-alert')" />
            </div>
            <div class="gdpr-text">
              <h3 class="gdpr-title">We value your privacy</h3>
              <p class="gdpr-description">
                We use cookies and similar technologies to improve your experience,
                analyze traffic, and personalize content. We also share information
                about your use of our site with our analytics partners.
                By clicking "Accept All", you consent to our use of cookies.
                You can manage your preferences or learn more in our
                <NuxtLink to="/privacy" class="gdpr-link">Privacy Policy</NuxtLink>.
              </p>
            </div>
          </div>
          <div class="gdpr-actions">
            <button class="btn-gdpr-settings" @click="openSettings">
              Cookie Settings
            </button>
            <button class="btn-gdpr-accept" @click="acceptAll">
              Accept All
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Settings Modal -->
    <Transition name="modal">
      <div v-if="showSettings" class="modal-overlay" @click.self="closeSettings">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Cookie Preferences</h2>
            <button class="modal-close" @click="closeSettings">
              <component :is="getIcon('x')" />
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-intro">
              Customize your cookie preferences. Necessary cookies are always enabled
              as they are essential for the website to function properly.
            </p>

            <!-- Necessary -->
            <div class="cookie-option">
              <div class="cookie-info">
                <h4>Necessary Cookies</h4>
                <p>Required for the website to function. Cannot be disabled.</p>
              </div>
              <label class="toggle">
                <input type="checkbox" checked disabled>
                <span class="toggle-slider"></span>
              </label>
            </div>

            <!-- Analytics -->
            <div class="cookie-option">
              <div class="cookie-info">
                <h4>Analytics Cookies</h4>
                <p>Help us understand how visitors interact with the website.</p>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="preferences.analytics">
                <span class="toggle-slider"></span>
              </label>
            </div>

            <!-- Marketing -->
            <div class="cookie-option">
              <div class="cookie-info">
                <h4>Marketing Cookies</h4>
                <p>Used to deliver relevant advertisements and track campaign performance.</p>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="preferences.marketing">
                <span class="toggle-slider"></span>
              </label>
            </div>

            <!-- Functional -->
            <div class="cookie-option">
              <div class="cookie-info">
                <h4>Functional Cookies</h4>
                <p>Enable enhanced functionality and personalization.</p>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="preferences.functional">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-gdpr-accept" @click="savePreferences">
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getIcon } from '@/components/utils/global.ts'

const visible = ref(false)
const showSettings = ref(false)

const preferences = ref({
  analytics: true,
  marketing: false,
  functional: true
})

onMounted(() => {
  const consent = localStorage.getItem('talentbay_cookie_consent')
  if (!consent) {
    // Небольшая задержка для плавного появления
    setTimeout(() => {
      visible.value = true
      document.body.style.overflow = 'hidden'
    }, 500)
  }
})

const acceptAll = () => {
  const consentData = {
    necessary: true,
    analytics: true,
    marketing: true,
    functional: true,
    timestamp: new Date().toISOString()
  }
  localStorage.setItem('talentbay_cookie_consent', JSON.stringify(consentData))
  visible.value = false
  showSettings.value = false
  document.body.style.overflow = ''
}

const openSettings = () => {
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
}

const savePreferences = () => {
  const consentData = {
    necessary: true,
    analytics: preferences.value.analytics,
    marketing: preferences.value.marketing,
    functional: preferences.value.functional,
    timestamp: new Date().toISOString()
  }
  localStorage.setItem('talentbay_cookie_consent', JSON.stringify(consentData))
  visible.value = false
  showSettings.value = false
  document.body.style.overflow = ''
}
</script>

<style lang="scss" scoped>
// Overlay
.gdpr-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 37, 64, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 24px;
}

.gdpr-banner {
  background: var(--cloud-white);
  border-radius: 20px;
  padding: 32px;
  max-width: 700px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(10, 37, 64, 0.3);
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.gdpr-content {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.gdpr-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(0, 212, 170, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--electric-teal);
  font-size: 1.5rem;
}

.gdpr-title {
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--deep-navy);
  margin-bottom: 8px;
}

.gdpr-description {
  font-size: 0.95rem;
  color: var(--cool-gray);
  line-height: 1.6;
  margin: 0;
}

.gdpr-link {
  color: var(--electric-teal);
  text-decoration: underline;
  font-weight: 500;

  &:hover {
    text-decoration: none;
  }
}

.gdpr-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.btn-gdpr-settings {
  background: transparent;
  border: 2px solid var(--light-gray);
  color: var(--cool-gray);
  font-family: 'Exo 2', sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 12px 24px;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: var(--electric-teal);
    color: var(--electric-teal);
  }
}

.btn-gdpr-accept {
  background: var(--electric-teal);
  border: none;
  color: var(--deep-navy);
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 12px 32px;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: var(--electric-teal-deep);
    box-shadow: 0 8px 25px rgba(0, 212, 170, 0.3);
    transform: translateY(-2px);
  }
}

// Settings Modal
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 37, 64, 0.7);
  backdrop-filter: blur(6px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal-content {
  background: var(--cloud-white);
  border-radius: 24px;
  padding: 0;
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 80px rgba(10, 37, 64, 0.4);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 32px 0;
}

.modal-title {
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: var(--deep-navy);
}

.modal-close {
  background: none;
  border: none;
  color: var(--cool-gray);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;

  &:hover {
    background: var(--light-gray);
    color: var(--deep-navy);
  }
}

.modal-body {
  padding: 20px 32px 32px;
}

.modal-intro {
  font-size: 0.95rem;
  color: var(--cool-gray);
  line-height: 1.6;
  margin-bottom: 28px;
}

.cookie-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid var(--light-gray);

  &:last-child {
    border-bottom: none;
  }
}

.cookie-info {
  h4 {
    font-family: 'Exo 2', sans-serif;
    font-weight: 600;
    font-size: 1rem;
    color: var(--deep-navy);
    margin-bottom: 4px;
  }

  p {
    font-size: 0.85rem;
    color: var(--cool-gray);
    margin: 0;
  }
}

// Toggle Switch
.toggle {
  position: relative;
  width: 52px;
  height: 28px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .toggle-slider {
      background: var(--electric-teal);
    }

    &:checked + .toggle-slider::before {
      transform: translateX(24px);
    }

    &:disabled + .toggle-slider {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--light-gray);
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.3s;

  &::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

.modal-footer {
  padding: 20px 32px 28px;
  display: flex;
  justify-content: flex-end;
}

// Transitions
.gdpr-enter-active,
.gdpr-leave-active,
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.gdpr-enter-from,
.gdpr-leave-to,
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .gdpr-banner {
    padding: 24px;
    border-radius: 16px;
  }

  .gdpr-content {
    flex-direction: column;
    gap: 12px;
  }

  .gdpr-actions {
    flex-direction: column;

    button {
      width: 100%;
    }
  }

  .modal-content {
    margin: 0 8px;
    max-height: 85vh;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 20px;
    padding-right: 20px;
  }
}
</style>
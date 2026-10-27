import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  runtimeConfig: {
    telegramBotToken: '',
    telegramBotID: '',
    telegramBotUsername: '',
    telegramWebhookSecret: '',
    telegramAppOrigin: '',
    public: {
      localReviewPortal: '',
    },
  },

  css: [
    '@/assets/css/main.css',
  ],

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-auth-utils',
  ],

  eslint: {
    checker: false,
  },

  ui: {
    fonts: false,
  },

  routeRules: {
    '/': { redirect: { to: '/jobs', statusCode: 302 } },
    '/landing': { redirect: { to: '/jobs', statusCode: 302 } },
    '/presentation': { redirect: { to: '/jobs', statusCode: 302 } },
    '/whitepaper': { redirect: { to: '/jobs', statusCode: 302 } },
    '/user/**': { ssr: false },
    '/profile': { ssr: false },
    '/applications': { ssr: false },
    '/settings': { ssr: false },
    '/orgs/**': { ssr: false },
    '/ktulhu/**': { ssr: false },
    '/jobs/**': { ssr: true },
  },

  colorMode: {
    preference: 'system',
    fallback: 'light',
  },

  hooks: {
    'nitro:config': (config) => {
      const handler = fileURLToPath(new URL('./server/errors/api.ts', import.meta.url))
      const existing = config.errorHandler ? Array.isArray(config.errorHandler) ? config.errorHandler : [config.errorHandler] : []
      // Prepend the API-only boundary; keep Nuxt's normal HTML error renderer after it.
      config.errorHandler = [handler, ...existing.filter(value => value !== handler)]
    },
  },

})

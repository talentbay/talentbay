// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  runtimeConfig: {
    telegramBotToken: '',
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

})

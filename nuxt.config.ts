// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,

  css: [
    '@/assets/scss/main.scss',
    '@/assets/css/main.css',
  ],

  modules: [
    '@nuxt/ui',
    'nuxt-auth-utils',
  ],

  ui: {
    fonts: false,
  },

  routeRules: {
    '/': { ssr: false },
    '/landing': { ssr: false },
    '/presentation': { ssr: false },
    '/whitepaper': { ssr: false },
    '/user/**': { ssr: false },
    '/orgs/**': { ssr: false },
    '/ktulhu/**': { ssr: false },
    '/jobs/**': { ssr: true },
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
  },

  vite: {
    optimizeDeps: {
      include: [
        'bootstrap',
      ],
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/scss/variables.scss" as *;',
        },
      },
    },
  },

  experimental: {
    serverAppConfig: false,
  },
})

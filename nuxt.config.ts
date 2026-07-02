// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,

  css: [
    '@/assets/scss/main.scss'
  ],

  modules: [
      'nuxt-auth-utils',
  ],
  vite: {
    optimizeDeps: {
      include: [
          'bootstrap'
      ]
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/scss/variables.scss" as *;'
        }
      }
    }
  },
  experimental: {
    serverAppConfig: false,
  },
})
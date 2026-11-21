import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  ignores: [
    '.nuxt/**',
    '.output/**',
    '.output-native-review/**',
    '.native-review-publish/**',
    'coverage/**',
    'test-results/**',
    'playwright-report/**',
    'node_modules/**',
  ],
}, {
  files: [
    'app/components/Slide.vue',
    'app/components/login.vue',
    'app/components/logo.vue',
    'app/components/navbar.vue',
  ],
  rules: {
    'vue/multi-word-component-names': 'off',
  },
})

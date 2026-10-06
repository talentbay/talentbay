export { createError } from 'h3'

export function useRuntimeConfig() {
  return {
    session: { name: 'nuxt-session', password: 'oauth-test-only-password-at-least-32-characters' },
    oauth: {
      google: {
        clientId: 'test-google',
        clientSecret: 'test-only',
        authorizationURL: 'https://oauth.invalid/google/authorize',
        tokenURL: 'https://oauth.invalid/google/token',
        userURL: 'https://oauth.invalid/google/user',
      },
      github: {
        clientId: 'test-github',
        clientSecret: 'test-only',
        authorizationURL: 'https://oauth.invalid/github/authorize',
        tokenURL: 'https://oauth.invalid/github/token',
        apiURL: 'https://oauth.invalid/github',
      },
    },
  }
}

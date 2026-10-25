import type { SessionUser } from './auth'

declare module '#auth-utils' {
  interface User {
    id: SessionUser['id']
    role: SessionUser['role']
    name: SessionUser['name']
    email: SessionUser['email']
    avatarUrl: SessionUser['avatarUrl']
  }
  interface SecureSessionData {
    oauthLink?: {
      provider: 'GOOGLE' | 'GITHUB'
      userID: number
      expiresAt: number
    }
  }
}

declare module '#app' {
  interface PageMeta {
    authRole?: SessionUser['role']
  }
}

export {}

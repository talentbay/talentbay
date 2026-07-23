import type { SessionUser } from './auth'

declare module '#auth-utils' {
  interface User {
    id: SessionUser['id']
    role: SessionUser['role']
    name: SessionUser['name']
    email: SessionUser['email']
    avatarUrl: SessionUser['avatarUrl']
  }
}

export {}

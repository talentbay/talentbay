export type SessionUser = {
  id: number
  role: 'USER' | 'ADMIN'
  name: string
  email: string | null
  avatarUrl: string | null
}

export type IdentityProvider = 'GOOGLE' | 'GITHUB' | 'TELEGRAM'

export type ConnectedIdentity = {
  provider: IdentityProvider
  email: string | null
  connectedAt: string
}

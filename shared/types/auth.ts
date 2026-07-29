export type SessionUser = {
  id: number
  role: 'USER' | 'ADMIN'
  name: string
  email: string
  avatarUrl: string | null
}

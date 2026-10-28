export type SessionUser = {
  id: number
  role: 'USER' | 'ADMIN'
  name: string
  email: string | null
  avatarUrl: string | null
}

export type IdentityProvider = 'GOOGLE' | 'GITHUB' | 'TELEGRAM'

export const telegramAuthRejectionReasons = ['payload', 'duplicate', 'format', 'expired', 'future', 'hmac', 'user_json', 'user_schema'] as const
export type TelegramAuthRejectionReason = typeof telegramAuthRejectionReasons[number]

export type ConnectedIdentity = {
  provider: IdentityProvider
  email: string | null
  connectedAt: string
}

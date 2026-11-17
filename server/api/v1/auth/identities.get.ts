import { listConnectedIdentities } from '#server/services/auth/oauth-user'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  setHeader(event, 'cache-control', 'no-store')
  return { items: await listConnectedIdentities(session.user.id) }
})

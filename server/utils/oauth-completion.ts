import type { H3Event } from 'h3'
import { authenticateOAuthUser } from '#server/services/auth/oauth-user'
import type { OAuthIdentity } from '#server/services/auth/oauth-user'

export async function completeOAuthAuthentication(event: H3Event, identity: OAuthIdentity) {
  const session = await getUserSession(event)
  const intent = session.secure?.oauthLink
  if (intent) {
    if (!session.user || intent.userID !== session.user.id
      || intent.provider !== identity.provider || intent.expiresAt <= Date.now()) {
      throw createError({ statusCode: 409, statusMessage: 'Connection request expired. Try again in Settings.' })
    }
    const user = await authenticateOAuthUser(identity, session.user.id)
    await replaceUserSession(event, { user })
  }
  else {
    if (session.user) {
      throw createError({ statusCode: 409, statusMessage: 'Use Settings to connect another sign-in method, or sign out first.' })
    }
    const user = await authenticateOAuthUser(identity)
    await setUserSession(event, { user })
  }
  return send(event, '<!doctype html><html><body><script>if(window.opener){window.close()}else{window.location.replace("/user/profile")}</script></body></html>', 'text/html')
}

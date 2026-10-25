import { completeOAuthAuthentication } from '#server/utils/oauth-completion'
import { logHandledRequestError } from '#server/utils/observability'
import { withOAuthCallbackState } from '#server/utils/oauth-callback-state'

export default withOAuthCallbackState(defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
    return completeOAuthAuthentication(event, {
      provider: 'GOOGLE',
      providerAccountID: user.sub,
      email: user.email,
      emailVerified: user.email_verified,
      name: user.name,
      avatarUrl: user.picture,
    })

  },
  onError(event, error) {
    logHandledRequestError(event, error, 'oauth.google')
    return send(event, '<!doctype html><html><body><script>window.close()</script></body></html>', 'text/html')
  },
}))

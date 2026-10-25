import { completeOAuthAuthentication } from '#server/utils/oauth-completion'
import { logHandledRequestError } from '#server/utils/observability'
import { withOAuthCallbackState } from '#server/utils/oauth-callback-state'

type GitHubEmail = {
  email: string
  primary: boolean
  verified: boolean
}

export default withOAuthCallbackState(defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user, tokens }) {
    const emails = await $fetch<GitHubEmail[]>('https://api.github.com/user/emails', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${tokens.access_token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    const verifiedEmail = emails.find(email => email.primary && email.verified)
      ?? emails.find(email => email.verified)

    if (!verifiedEmail) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A verified GitHub email address is required',
      })
    }

    return completeOAuthAuthentication(event, {
      provider: 'GITHUB',
      providerAccountID: String(user.id),
      name: user.name || user.login,
      avatarUrl: user.avatar_url,
      email: verifiedEmail.email,
      emailVerified: true,
    })

  },
  onError(event, error) {
    logHandledRequestError(event, error, 'oauth.github')
    return send(event, '<!doctype html><html><body><script>window.close()</script></body></html>', 'text/html')
  },
}))

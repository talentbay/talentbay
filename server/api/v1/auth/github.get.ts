import { authenticateOAuthUser } from '#server/services/auth/oauth-user'

type GitHubEmail = {
  email: string
  primary: boolean
  verified: boolean
}

export default defineOAuthGitHubEventHandler({
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

    const sessionUser = await authenticateOAuthUser({
      provider: 'GITHUB',
      providerAccountID: String(user.id),
      name: user.name || user.login,
      avatarUrl: user.avatar_url,
      email: verifiedEmail.email,
      emailVerified: true,
    })

    await setUserSession(event, { user: sessionUser })
    return send(event, '<html><script>window.close();</script></html>', 'text/html')
  },
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return send(event, '<!doctype html><html><body><script>window.close()</script></body></html>', 'text/html')
  },
})

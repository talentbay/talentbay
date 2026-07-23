import { authenticateOAuthUser } from '#server/services/auth/oauth-user'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
    const sessionUser = await authenticateOAuthUser({
      provider: 'GOOGLE',
      providerAccountID: user.sub,
      email: user.email,
      emailVerified: user.email_verified,
      name: user.name,
      avatarUrl: user.picture,
    })

    await setUserSession(event, { user: sessionUser })
    return send(event, '<html><script>window.close();</script></html>', 'text/html')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/login')
  },
})

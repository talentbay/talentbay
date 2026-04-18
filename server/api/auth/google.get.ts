export default defineOAuthGoogleEventHandler({
    async onSuccess(event, { user, tokens }) {
        // You can extend the session with database data here
        await setUserSession(event, {
            user: {
                googleId: user.id,
                email: user.email,
                name: user.name,
                avatar: user.picture
            }
        })
        return send(event, '<html><script>window.close();</script></html>', 'text/html')
    },
    onError(event, error) {
        console.error('Google OAuth error:', error)
        return sendRedirect(event, '/login')
    }
})
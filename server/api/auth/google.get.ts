import {isRegistered} from '#server/utils/registered'

export default defineOAuthGoogleEventHandler({
    async onSuccess(event, { user, tokens }) {
        // You can extend the session with database data here
        const userData = await isRegistered({
            providerID: user.sub,
            email: user.email,
            name: user.name,
            provider: 'GOOGLE',
            avatar: user.picture
        })

        await setUserSession(event, {user: userData})
        return send(event, '<html><script>window.close();</script></html>', 'text/html')
    },
    onError(event, error) {
        console.error('Google OAuth error:', error)
        return sendRedirect(event, '/login')
    }
})
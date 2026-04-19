import {isRegistered} from '#server/utils/registered'

export default defineOAuthGitHubEventHandler({
    config: {
        // Запрашиваем email пользователя (через запятую можно добавить другие, например 'repo')
        scope: ['user:email']
    },
    async onSuccess(event, { user }) {
        const userData = await isRegistered({
            providerID: user.id,
            name: user.name,
            avatar: user.avatar_url,
            email: user.email,
            provider: 'GITHUB',
        })

        await setUserSession(event, {user: userData})

        // Возвращаем скрипт для автоматического закрытия попапа
        return send(event, '<html><script>window.close();</script></html>', 'text/html')
    },
    onError(event, error) {
        console.error('GitHub OAuth error:', error)
        return sendRedirect(event, '/')
    }
})
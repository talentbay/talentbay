export default defineOAuthGitHubEventHandler({
    config: {
        // Запрашиваем email пользователя (через запятую можно добавить другие, например 'repo')
        scope: ['user:email']
    },
    async onSuccess(event, { user }) {
        // Сохраняем сессию
        await setUserSession(event, {
            user: {
                githubId: user.id,
                login: user.login,
                name: user.name,
                avatar: user.avatar_url
            }
        })

        // Возвращаем скрипт для автоматического закрытия попапа
        return send(event, '<html><script>window.close();</script></html>', 'text/html')
    },
    onError(event, error) {
        console.error('GitHub OAuth error:', error)
        return sendRedirect(event, '/')
    }
})
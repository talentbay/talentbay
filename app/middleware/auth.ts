export default defineNuxtRouteMiddleware((to, from) => {
    const { loggedIn, user } = useUserSession()
    if (!loggedIn.value) {
        return navigateTo('/user/restricted')
    } else {
        // @ts-ignore
        if (to.meta.authRole && to.meta.authRole !== user.value.role) {
            return navigateTo('/user/restricted')
        }
    }
})
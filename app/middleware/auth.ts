export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo('/user/login', {
      redirectCode: 302,
      replace: true,
    })
  }

  if (to.meta.authRole && to.meta.authRole !== user.value?.role) {
    return navigateTo('/user/restricted')
  }
})

export function useAccountResource<T>(key: string, path: string) {
  const { loggedIn, user } = useUserSession()
  const resource = useFetch<T>(path, { key, server: false, immediate: false, watch: false })
  watch(() => loggedIn.value ? user.value?.id : null, (id) => {
    resource.clear()
    if (import.meta.client && id) void resource.execute()
  }, { immediate: true })
  return resource
}

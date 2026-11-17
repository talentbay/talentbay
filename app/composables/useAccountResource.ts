import type { Ref } from 'vue'

export function useAccountResource<T>(key: string, path: string, query?: Ref<Record<string, string | number | undefined>>) {
  const { loggedIn, user } = useUserSession()
  const resource = useFetch<T>(path, { key, query, server: false, immediate: false, watch: false })
  watch([() => loggedIn.value ? user.value?.id : null, () => query?.value], ([id]) => {
    resource.clear()
    if (import.meta.client && id) void resource.execute()
  }, { immediate: true })
  return resource
}

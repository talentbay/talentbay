import { safeHttpHref } from '#shared/utils/safe-http-url'

export function safeHttpUrl(value: string | null | undefined) {
  return safeHttpHref(value)
}

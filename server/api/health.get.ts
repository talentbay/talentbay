import { getServerRuntime } from '#server/utils/runtime-environment'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'cache-control', 'no-store')

  return {
    status: 'ok' as const,
    service: 'talentbay',
    runtime: getServerRuntime(),
    timestamp: new Date().toISOString(),
  }
})

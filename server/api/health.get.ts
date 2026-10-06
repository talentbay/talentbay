// Liveness only: this endpoint does not assert database or provider readiness.
export default defineEventHandler((event) => {
  setResponseHeader(event, 'cache-control', 'no-store')

  return {
    status: 'ok' as const,
    service: 'talentbay',
  }
})

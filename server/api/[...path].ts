export default defineEventHandler((event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  setResponseStatus(event, 404)
  return { statusCode: 404, statusMessage: 'API endpoint not found' }
})

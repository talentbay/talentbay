import { isPrivateApiRequest } from '#server/utils/private-api'

export default defineEventHandler((event) => {
  if (isPrivateApiRequest(event.path)) setResponseHeader(event, 'cache-control', 'no-store')
})

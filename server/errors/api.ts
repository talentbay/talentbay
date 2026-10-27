import { send, setResponseHeaders, setResponseStatus } from 'h3'
import { isApiRequest, safeApiFailure } from '#server/utils/private-api'

export default defineNitroErrorHandler((error, event) => {
  if (!isApiRequest(event.path)) return
  const response = safeApiFailure(error)
  setResponseStatus(event, response.status)
  setResponseHeaders(event, {
    'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8',
    'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'referrer-policy': 'no-referrer',
    'content-security-policy': "script-src 'none'; frame-ancestors 'none';",
  })
  return send(event, JSON.stringify(response.body))
})

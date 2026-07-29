import { randomUUID } from 'node:crypto'
import {
  attachRequestTelemetry,
  createErrorLog,
  createRequestLog,
  getRequestTelemetry,
  shouldLogRequest,
  writeStructuredLog,
} from '#server/utils/observability'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    if (!shouldLogRequest(event.path)) {
      return
    }

    const telemetry = attachRequestTelemetry(event, randomUUID())
    setResponseHeader(event, 'x-request-id', telemetry.requestId)
  })

  nitroApp.hooks.hook('afterResponse', (event) => {
    const telemetry = getRequestTelemetry(event)
    if (!telemetry) {
      return
    }

    writeStructuredLog(createRequestLog(telemetry, getResponseStatus(event)))
  })

  nitroApp.hooks.hook('error', (error, { event }) => {
    writeStructuredLog(createErrorLog(error, 'nitro', event))
  })
})

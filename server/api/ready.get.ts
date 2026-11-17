import { sql } from 'drizzle-orm'
import { isDatabaseConfigured, useDatabase } from '#server/db'
import { getServerRuntime } from '#server/utils/runtime-environment'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')

  const runtime = getServerRuntime()

  if (!isDatabaseConfigured()) {
    setResponseStatus(event, 503)

    return {
      status: 'not-ready' as const,
      runtime,
      checks: {
        database: 'not-configured' as const,
      },
    }
  }

  try {
    await useDatabase().execute(sql`select 1`)

    return {
      status: 'ready' as const,
      runtime,
      checks: {
        database: 'ok' as const,
      },
    }
  }
  catch {
    setResponseStatus(event, 503)

    return {
      status: 'not-ready' as const,
      runtime,
      checks: {
        database: 'unreachable' as const,
      },
    }
  }
})

import { pathToFileURL } from 'node:url'

const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]'])

/** Refuse shared/cloud targets before running CI migrations or integration tests. */
export function assertCiDatabaseEnvironment(environment = process.env) {
  if (environment.CI !== 'true' || environment.TALENTBAY_TEST_DATABASE !== 'disposable') {
    throw new Error('CI database operations require the explicit disposable-database marker')
  }

  const targets = ['DATABASE_URL', 'DATABASE_MIGRATION_URL'].map((key) => {
    let url
    try {
      if (!environment[key]) {
        throw new Error('Missing URL')
      }
      url = new URL(environment[key])
    }
    catch {
      // Never include a connection string or parser error in logs.
      throw new Error(`${key} must contain a valid disposable PostgreSQL URL`)
    }

    if (
      !['postgres:', 'postgresql:'].includes(url.protocol)
      || !loopbackHosts.has(url.hostname)
      || url.pathname !== '/talentbay_ci'
      || url.username !== 'talentbay_ci'
      || url.search !== ''
      || url.hash !== ''
    ) {
      throw new Error(`${key} must target the local talentbay_ci database and role without URL options`)
    }

    return `${url.hostname}:${url.port || '5432'}${url.pathname}`
  })

  if (targets[0] !== targets[1]) {
    throw new Error('CI runtime and migration connections must target the same disposable database')
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    assertCiDatabaseEnvironment()
    console.log('Disposable CI database target verified.')
  }
  catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}

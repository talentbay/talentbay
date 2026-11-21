import { defineConfig } from 'drizzle-kit'

const migrationUrl = process.env.DATABASE_MIGRATION_URL?.trim()
if (process.argv[2] === 'migrate' && !migrationUrl) {
  throw new Error('DATABASE_MIGRATION_URL is required for migrations; the runtime connection is not used.')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema/index.ts',
  out: './server/db/migrations',
  ...(migrationUrl ? { dbCredentials: { url: migrationUrl } } : {}),
  verbose: true,
  strict: true,
})

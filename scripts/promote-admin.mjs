import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const usage = `Usage:
  pnpm db:promote-admin -- user@example.com
  pnpm db:promote-admin -- user@example.com --apply

The first command is a dry run. The user must already exist after OAuth sign-in.
Add --apply only after verifying the target database and user.`

export function parsePromotionArgs(args) {
  const commandArgs = args.filter(arg => arg !== '--')

  if (commandArgs.includes('--help') || commandArgs.includes('-h')) {
    return { help: true }
  }

  const unknownFlags = commandArgs
    .filter(arg => arg.startsWith('-') && arg !== '--apply')
  if (unknownFlags.length > 0) {
    throw new Error(`Unknown option: ${unknownFlags[0]}`)
  }

  const positional = commandArgs.filter(arg => !arg.startsWith('-'))
  if (positional.length !== 1) {
    throw new Error('Exactly one user email is required')
  }

  const email = positional[0].trim().toLowerCase()
  if (
    email.length > 320
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error('A valid user email is required')
  }

  return {
    help: false,
    email,
    apply: commandArgs.includes('--apply'),
  }
}

export async function promoteAdmin({
  email,
  apply,
  connectionString,
}) {
  if (!connectionString) {
    throw new Error('DATABASE_MIGRATION_URL or DATABASE_URL is required')
  }

  const sql = postgres(connectionString, {
    max: 1,
    prepare: false,
  })

  try {
    return await sql.begin(async (transaction) => {
      const matches = await transaction`
        select id, email, role
        from users
        where lower(email) = ${email}
        order by id
        limit 2
        for update
      `

      if (matches.length === 0) {
        throw new Error(
          'User not found. Complete OAuth sign-in before assigning an admin role.',
        )
      }

      if (matches.length > 1) {
        throw new Error('Multiple case-insensitive email matches found; aborting')
      }

      const [user] = matches
      if (!user) {
        throw new Error('User lookup returned no result')
      }

      if (!apply || user.role === 'ADMIN') {
        return {
          action: 'admin-role-promotion',
          mode: apply ? 'apply' : 'dry-run',
          outcome: user.role === 'ADMIN' ? 'unchanged' : 'pending',
          userId: user.id,
          email: user.email,
          previousRole: user.role,
          nextRole: 'ADMIN',
          timestamp: new Date().toISOString(),
        }
      }

      const [updatedUser] = await transaction`
        update users
        set role = 'ADMIN', updated_at = now()
        where id = ${user.id}
        returning id, email, role
      `

      if (!updatedUser) {
        throw new Error('Failed to update the user role')
      }

      return {
        action: 'admin-role-promotion',
        mode: 'apply',
        outcome: 'updated',
        userId: updatedUser.id,
        email: updatedUser.email,
        previousRole: user.role,
        nextRole: updatedUser.role,
        timestamp: new Date().toISOString(),
      }
    })
  }
  finally {
    await sql.end()
  }
}

async function main() {
  try {
    const options = parsePromotionArgs(process.argv.slice(2))
    if (options.help) {
      console.log(usage)
      return
    }

    const result = await promoteAdmin({
      email: options.email,
      apply: options.apply,
      connectionString: process.env.DATABASE_MIGRATION_URL
        || process.env.DATABASE_URL,
    })

    console.log(JSON.stringify(result, null, 2))

    if (!options.apply && result.outcome === 'pending') {
      console.log('Dry run only. Re-run with --apply to make this change.')
    }
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : error)
    console.error(usage)
    process.exitCode = 1
  }
}

const isDirectExecution = process.argv[1]
  && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  await main()
}

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import postgres from 'postgres'

const usage = `Usage:
  pnpm db:promote-admin -- user@example.com
  pnpm db:promote-admin -- user@example.com --apply
  pnpm db:promote-admin -- --user-id 42
  pnpm db:promote-admin -- --user-id 42 --apply

Commands without --apply are dry runs. The local user must already exist after sign-in.
--user-id is a TalentBay user ID, not a Telegram/provider subject or username.
Add --apply only after verifying the target database and user.`

export function parsePromotionArgs(args) {
  const { values, positionals, tokens } = parseArgs({
    args: args[0] === '--' ? args.slice(1) : args, allowPositionals: true, strict: true, tokens: true,
    options: { apply: { type: 'boolean' }, 'user-id': { type: 'string' }, help: { type: 'boolean', short: 'h' } },
  })
  if (values.help) return { help: true }
  for (const name of ['apply', 'user-id']) {
    if (tokens.filter(token => token.kind === 'option' && token.name === name).length > 1) throw new Error(`Duplicate option: ${name}`)
  }
  const target = normalizeTarget({ email: positionals.length === 1 ? positionals[0] : undefined, userId: values['user-id'] })
  if (positionals.length > 1) throw new Error('Exactly one target is required')
  return { help: false, ...target, apply: values.apply ?? false }
}

function normalizeTarget({ email, userId }) {
  if ((email !== undefined) === (userId !== undefined)) throw new Error('Choose exactly one email or --user-id')
  if (userId !== undefined) {
    if (!/^[1-9]\d*$/.test(String(userId)) || !Number.isSafeInteger(Number(userId)) || Number(userId) > 2_147_483_647) throw new Error('A positive local user ID is required')
    return { userId: Number(userId) }
  }
  email = String(email).trim().toLowerCase()
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid user email is required')
  return { email }
}

export async function promoteAdmin({
  email,
  userId,
  apply,
  connectionString,
}) {
  const target = normalizeTarget({ email, userId })
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
        where ${target.userId !== undefined ? sql`id = ${target.userId}` : sql`lower(email) = ${target.email}`}
        order by id
        limit 2
        for update
      `

      if (matches.length === 0) {
        throw new Error(
          'User not found. Complete sign-in before assigning an admin role.',
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
      userId: options.userId,
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

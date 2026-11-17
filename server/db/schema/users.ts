import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN'])

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    role: userRoleEnum('role').notNull().default('USER'),
    name: text('name').notNull(),
    email: text('email').unique(),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  table => [
    index('users_role_idx').on(table.role),
  ],
)

// Retain the deployed table/type names while extending the local identity model.
export const oauthProviderEnum = pgEnum('oauth_provider', ['GITHUB', 'GOOGLE', 'TELEGRAM'])

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: serial('id').primaryKey(),
    userID: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: oauthProviderEnum('provider').notNull(),
    providerAccountID: text('provider_account_id').notNull(),
    providerEmail: text('provider_email'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [
    index('oauth_accounts_user_id_idx').on(table.userID),
    uniqueIndex('oauth_accounts_provider_account_idx')
      .on(table.provider, table.providerAccountID),
  ],
)

export const candidateProfiles = pgTable('candidate_profiles', {
  userID: integer('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  headline: text('headline'),
  about: text('about'),
  countryCode: text('country_code'),
  city: text('city'),
  phone: text('phone'),
  telegram: text('telegram'),
  githubUrl: text('github_url'),
  linkedinUrl: text('linkedin_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

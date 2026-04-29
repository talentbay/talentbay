import { pgTable, text, serial, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role',
    ['USER', 'MEMBER', 'ORG', 'ADMIN'])

type Profile = {
    firstName: string,
    lastName: string,
    about: string,
    country: string,
    city: string,
    phone: string,
    telegram: string,
    github: string,
}

export const users = pgTable('users', {
    id: serial().primaryKey(),
    role: roleEnum('role').default('USER'),
    name: text().notNull(),
    email: text().notNull().unique(),
    provider: text().notNull(),
    providerID: text().notNull(),
    avatar: text(),
    createdAt: timestamp().notNull().defaultNow(),
    password: text(),
    profile: jsonb('profile').$type<Profile>()
})
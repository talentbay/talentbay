import { relations } from 'drizzle-orm'
import { applications } from './applications'
import { organisationMembers, organisations } from './organisations'
import { relocationLocations } from './relocation'
import { candidateProfiles, oauthAccounts, users } from './users'
import { vacancies } from './vacancies'

export const usersRelations = relations(users, ({ many, one }) => ({
  oauthAccounts: many(oauthAccounts),
  candidateProfile: one(candidateProfiles),
  organisationMemberships: many(organisationMembers),
  applications: many(applications),
}))

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userID],
    references: [users.id],
  }),
}))

export const candidateProfilesRelations = relations(candidateProfiles, ({ one }) => ({
  user: one(users, {
    fields: [candidateProfiles.userID],
    references: [users.id],
  }),
}))

export const organisationsRelations = relations(organisations, ({ many, one }) => ({
  members: many(organisationMembers),
  vacancies: many(vacancies),
  createdBy: one(users, {
    fields: [organisations.createdByUserID],
    references: [users.id],
  }),
}))

export const organisationMembersRelations = relations(organisationMembers, ({ one }) => ({
  organisation: one(organisations, {
    fields: [organisationMembers.organisationID],
    references: [organisations.id],
  }),
  user: one(users, {
    fields: [organisationMembers.userID],
    references: [users.id],
  }),
}))

export const relocationLocationsRelations = relations(relocationLocations, ({ many }) => ({
  vacancies: many(vacancies),
}))

export const vacanciesRelations = relations(vacancies, ({ many, one }) => ({
  organisation: one(organisations, {
    fields: [vacancies.organisationID],
    references: [organisations.id],
  }),
  relocationLocation: one(relocationLocations, {
    fields: [vacancies.relocationLocationID],
    references: [relocationLocations.id],
  }),
  createdBy: one(users, {
    fields: [vacancies.createdByUserID],
    references: [users.id],
  }),
  applications: many(applications),
}))

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, {
    fields: [applications.userID],
    references: [users.id],
  }),
  vacancy: one(vacancies, {
    fields: [applications.vacancyID],
    references: [vacancies.id],
  }),
}))

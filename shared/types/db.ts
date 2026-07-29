import type {
  applications,
  candidateProfiles,
  organisations,
  relocationLocations,
  users,
  vacancies,
} from '#server/db/schema'

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type CandidateProfile = typeof candidateProfiles.$inferSelect
export type Organisation = typeof organisations.$inferSelect
export type Vacancy = typeof vacancies.$inferSelect
export type Application = typeof applications.$inferSelect
export type RelocationLocation = typeof relocationLocations.$inferSelect

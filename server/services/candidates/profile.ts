import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDatabase } from '#server/db'
import type { Database } from '#server/db'
import type { CandidateProfileResponse, ReviewedCandidateProfileResponse } from '#shared/types/candidates'
import { applicationCandidateReview } from './application-candidate-context'

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()
const optionalUrl = z.union([z.url({ protocol: /^https?$/ }).max(2048), z.literal('')])
  .transform(value => value || null)
  .nullable()
  .optional()

export const candidateProfileInputSchema = z.object({
  headline: optionalText(160),
  about: optionalText(5_000),
  countryCode: z.union([z.string().trim().regex(/^[a-z]{2}$/i), z.literal('')])
    .transform(value => value ? value.toUpperCase() : null)
    .nullable()
    .optional(),
  city: optionalText(120),
  phone: optionalText(40),
  telegram: optionalText(80),
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
}).strict()

export type CandidateProfileInput = z.infer<typeof candidateProfileInputSchema>

export async function getCandidateProfile(
  userID: number,
  db: Pick<Database, 'select'> = useDatabase(),
): Promise<CandidateProfileResponse> {
  const [row] = await db
    .select({
      user: {
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatarUrl: schema.users.avatarUrl,
      },
      profile: {
        userID: schema.candidateProfiles.userID,
        headline: schema.candidateProfiles.headline,
        about: schema.candidateProfiles.about,
        countryCode: schema.candidateProfiles.countryCode,
        city: schema.candidateProfiles.city,
        phone: schema.candidateProfiles.phone,
        telegram: schema.candidateProfiles.telegram,
        githubUrl: schema.candidateProfiles.githubUrl,
        linkedinUrl: schema.candidateProfiles.linkedinUrl,
      },
    })
    .from(schema.users)
    .leftJoin(
      schema.candidateProfiles,
      eq(schema.users.id, schema.candidateProfiles.userID),
    )
    .where(eq(schema.users.id, userID))
    .limit(1)

  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    })
  }

  return {
    user: row.user,
    profile: row.profile ? {
      headline: row.profile.headline,
      about: row.profile.about,
      countryCode: row.profile.countryCode,
      city: row.profile.city,
      phone: row.profile.phone,
      telegram: row.profile.telegram,
      githubUrl: row.profile.githubUrl,
      linkedinUrl: row.profile.linkedinUrl,
    } : null,
  }
}

export async function getReviewedCandidateProfile(userID: number): Promise<ReviewedCandidateProfileResponse> {
  const candidate = await getCandidateProfile(userID)
  return { ...candidate, candidateContext: applicationCandidateReview(candidate).candidateContext }
}

export async function saveCandidateProfile(
  userID: number,
  input: CandidateProfileInput,
): Promise<ReviewedCandidateProfileResponse> {
  const db = useDatabase()
  await db
    .insert(schema.candidateProfiles)
    .values({
      userID,
      ...input,
    })
    .onConflictDoUpdate({
      target: schema.candidateProfiles.userID,
      set: {
        ...input,
        updatedAt: new Date(),
      },
    })

  return await getReviewedCandidateProfile(userID)
}

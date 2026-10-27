import type { CandidateProfileData } from './candidates'

// This version identifies the shown purpose/recipient notice, not legal approval.
export const applicationDisclosureVersion = 'talentbay-managed-v1' as const

export const handlingStages = ['RECEIVED', 'IN_PROGRESS', 'CONTACTED', 'SHARED', 'FOLLOW_UP', 'CLOSED'] as const
export type HandlingStage = typeof handlingStages[number]
export const handlingEventKinds = ['RECEIVED', 'ASSIGNED', 'STARTED', 'CONTACTED', 'SHARED', 'FOLLOW_UP', 'CLOSED', 'WITHDRAWN'] as const
export type HandlingEventKind = typeof handlingEventKinds[number]
export const handlingCloseReasons = ['VACANCY_CLOSED', 'CONTACT_UNAVAILABLE', 'NO_RESPONSE', 'CANDIDATE_REQUEST', 'COMPLETED'] as const
export type HandlingCloseReason = typeof handlingCloseReasons[number]

export type ApplicationSnapshot = {
  version: 1
  submittedAt: string
  disclosureVersion: typeof applicationDisclosureVersion
  candidate: {
    name: string
    email: string | null
    profile: CandidateProfileData
  }
  recipient: { organisationID: number; name: string }
  vacancy: { id: number; slug: string; title: string; city: string | null; countryCode: string; sourceUrl: string | null; sourceExternalID: string | null }
}

export type HandlingEventData = {
  assignedUserID?: number
  channel?: 'EMAIL' | 'PHONE' | 'PLATFORM' | 'OTHER'
  occurredAt?: string
  reference?: string
  closeReason?: HandlingCloseReason
}

import type { CandidateApplicationItem, CandidateProfileResponse } from './candidates'
import type { AdminHandlingEvent, ApplicationSnapshot, HandlingState } from './application-handling'

export type AdminApplicationItem = Omit<CandidateApplicationItem, 'coverLetter'> & {
  candidate: { id: number; name: string }
  handling: HandlingState
}

export type AdminApplicationsResponse = {
  items: AdminApplicationItem[]
  nextCursor: number | null
}

export type AdminApplicationDetail = CandidateApplicationItem & {
  candidate: CandidateProfileResponse
  submissionSnapshot: ApplicationSnapshot | null
  handling: HandlingState
  events: AdminHandlingEvent[]
  eventsTruncated: boolean
  handoffRecorded: boolean
}

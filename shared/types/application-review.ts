import type { CandidateApplicationItem, CandidateProfileResponse } from './candidates'
import type { ApplicationSnapshot } from './application-handling'

export type AdminApplicationItem = Omit<CandidateApplicationItem, 'coverLetter'> & {
  candidate: { id: number; name: string }
}

export type AdminApplicationsResponse = {
  items: AdminApplicationItem[]
  nextCursor: number | null
}

export type AdminApplicationDetail = CandidateApplicationItem & {
  candidate: CandidateProfileResponse
  submissionSnapshot: ApplicationSnapshot | null
}

import type { CandidateApplicationItem, CandidateProfileResponse } from './candidates'

export type AdminApplicationItem = Omit<CandidateApplicationItem, 'coverLetter'> & {
  candidate: { id: number; name: string }
}

export type AdminApplicationsResponse = {
  items: AdminApplicationItem[]
  nextCursor: number | null
}

export type AdminApplicationDetail = CandidateApplicationItem & {
  candidate: CandidateProfileResponse
}

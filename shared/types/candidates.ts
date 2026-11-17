import type { HandlingState, HandlingCloseReason, HandlingCorrectionReason, HandlingEventKind, HandlingStage } from './application-handling'

export type CandidateProfileData = {
  headline: string | null
  about: string | null
  countryCode: string | null
  city: string | null
  phone: string | null
  telegram: string | null
  githubUrl: string | null
  linkedinUrl: string | null
}

export type CandidateProfileResponse = {
  user: {
    id: number
    name: string
    email: string | null
    avatarUrl: string | null
  }
  profile: CandidateProfileData | null
}

export type CandidateApplicationItem = {
  id: number
  status: 'NEW' | 'VIEWED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN'
  coverLetter: string | null
  createdAt: string
  handling: Pick<HandlingState, 'stage'>
  vacancy: {
    slug: string
    title: string
    companyName: string
    city: string | null
    countryCode: string
  }
}

export type CandidateApplicationsResponse = {
  items: CandidateApplicationItem[]
  total: number
  nextCursor: number | null
  counts: { all: number; active: number; closed: number }
}

export type CandidateApplicationProgress = {
  id: number
  stage: HandlingStage
  legacy: boolean
  handoffRecorded: boolean
  nextCursor: number | null
  events: {
    revision: number
    kind: Exclude<HandlingEventKind, 'ASSIGNED'>
    createdAt: string
    occurredAt: string | null
    closeReason: HandlingCloseReason | null
    corrected?: boolean
    correctedRevision?: number | null
    correctionReason?: HandlingCorrectionReason | null
  }[]
}

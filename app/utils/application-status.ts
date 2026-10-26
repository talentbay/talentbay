import type { CandidateApplicationItem } from '#shared/types/candidates'

export const applicationStatuses: Record<CandidateApplicationItem['status'], { label: string, color: 'neutral' | 'primary' | 'success' | 'error', closed: boolean }> = {
  NEW: { label: 'Received by TalentBay', color: 'neutral', closed: false },
  VIEWED: { label: 'Viewed', color: 'neutral', closed: false },
  INTERVIEW: { label: 'Interview', color: 'primary', closed: false },
  OFFER: { label: 'Offer', color: 'success', closed: false },
  REJECTED: { label: 'Not selected', color: 'error', closed: true },
  WITHDRAWN: { label: 'Withdrawn', color: 'neutral', closed: true },
}

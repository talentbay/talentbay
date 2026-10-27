import type { HandlingStage } from './application-handling'
import type { CandidateApplicationItem } from './candidates'

export type AdminDashboard = {
  asOf: string
  window: { days: 7 | 30 | 90; from: string; before: string }
  users: number
  profiles: number
  organisations: number
  vacancies: { total: number; unreviewed: number; flagged: number; published: number }
  applications: number
  applicationStatuses: { status: CandidateApplicationItem['status']; count: number }[]
  work: { awaitingStart: number; inProgress: number; needsOwner: number; mine: number }
  handlingStages: { stage: HandlingStage; count: number }[]
  activity: { received: number; contactRecorded: number; handoffRecorded: number }
  firstStart: { samples: number; averageSeconds: number | null }
  oldest: { id: number; title: string; companyName: string; receivedAt: string; ageSeconds: number }[]
}

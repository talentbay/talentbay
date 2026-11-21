export type SourceRunState = 'FETCHING' | 'READY' | 'IMPORTED' | 'FAILED'
export type SourceRunReport = {
  fetchedAt: string | null
  pageCount: number
  recordCount: number
  contactSkippedIds: string[]
  mobilitySkippedIds?: string[] // Absent from older JSON reports.
  created: number
  updated: number
  unchanged: number
  failure: string | null
  issues: { index: number; id: string | null; code: string }[]
}
export type SourceRunProgress = {
  sourceKey: string
  runID: string
  state: SourceRunState | 'EXPIRED'
  nextOffset: number
  expiresAt: string
  retryAfterAt: string | null
  report: SourceRunReport
}

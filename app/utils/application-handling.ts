import type { HandlingCloseReason, HandlingEventKind, HandlingStage } from '#shared/types/application-handling'

export const handlingLabels: Record<HandlingStage, string> = {
  RECEIVED: 'Received by TalentBay', IN_PROGRESS: 'TalentBay is reviewing', CONTACTED: 'Company contact recorded',
  SHARED: 'Manual handoff recorded', FOLLOW_UP: 'TalentBay is following up', CLOSED: 'Handling closed',
}
export const handlingEventLabels: Record<HandlingEventKind, string> = {
  RECEIVED: 'Received by TalentBay', ASSIGNED: 'Operator assigned', STARTED: 'TalentBay started reviewing',
  CONTACTED: 'Company contact recorded', SHARED: 'TalentBay recorded a manual handoff', FOLLOW_UP: 'Follow-up recorded',
  CLOSED: 'TalentBay handling closed', WITHDRAWN: 'Application withdrawn',
}
export const handlingCloseLabels: Record<HandlingCloseReason, string> = {
  VACANCY_CLOSED: 'Vacancy closed', CONTACT_UNAVAILABLE: 'Company contact unavailable', NO_RESPONSE: 'No company response',
  CANDIDATE_REQUEST: 'Closed at candidate request', COMPLETED: 'TalentBay handling completed',
}
export const handlingTime = (date: string) => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(date)) + ' UTC'

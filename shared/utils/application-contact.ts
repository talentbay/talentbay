import type { CandidateProfileResponse } from '../types/candidates'

export function applicationContacts(candidate: CandidateProfileResponse | null | undefined) {
  const email = candidate?.user.email?.trim() || null
  const phone = candidate?.profile?.phone?.trim() || null
  const telegram = candidate?.profile?.telegram?.trim() || null
  return {
    email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
    phone: phone && /^[+()\d .-]{7,40}$/.test(phone) && phone.replace(/\D/g, '').length >= 7 ? phone : null,
    telegram: telegram && /^@?[a-z0-9_]{5,32}$/i.test(telegram) ? telegram : null,
  }
}

export function canSubmitApplication(candidate: CandidateProfileResponse | null | undefined) {
  const contacts = applicationContacts(candidate)
  return Boolean(candidate?.profile && candidate.user.name.trim() && Object.values(contacts).some(Boolean))
}

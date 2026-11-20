const maxVacancyID = 2_147_483_647
const tagLength = 24

// A navigation hint for public material content, never a credential or consent.
export function makeVacancyStart(id: number, applicationContext: unknown): string | null {
  if (!Number.isInteger(id) || id < 1 || id > maxVacancyID) return null
  if (typeof applicationContext !== 'string' || applicationContext.length !== 67
    || !/^v1:[a-f0-9]{64}$/.test(applicationContext)) return null
  return `job_${id}_${applicationContext.slice(3, 3 + tagLength)}`
}

export function parseVacancyStart(value: unknown): { id: number; revisionTag: string } | null {
  if (typeof value !== 'string' || value.length > 39) return null
  const match = /^job_([1-9][0-9]{0,9})_([a-f0-9]{24})$/.exec(value)
  if (!match || match[0] !== value) return null
  const id = Number(match[1])
  return id <= maxVacancyID ? { id, revisionTag: match[2]! } : null
}

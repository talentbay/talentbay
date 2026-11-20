import type { VacancySalary } from '#shared/types/vacancies'

export function formatVacancySalary(salary: VacancySalary | null) {
  if (!salary) return 'Salary not disclosed'
  // Currency/compact defaults differ between Node and browser ICU versions.
  const formatter = new Intl.NumberFormat('en', { style: 'currency', currency: salary.currency, notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 })
  const period = { YEAR: 'year', MONTH: 'month', HOUR: 'hour' }[salary.period]
  return `${formatter.format(salary.min)}–${formatter.format(salary.max)} / ${period}`
}

export function annualSalaryRange(salary: VacancySalary | null) {
  if (!salary || salary.period === 'HOUR') return null
  const multiplier = salary.period === 'MONTH' ? 12 : 1
  const low = salary.min * multiplier, high = salary.max * multiplier
  return { low, midpoint: (low + high) / 2, high }
}

export function annualSalaryMidpoint(salary: VacancySalary | null): number | null {
  return annualSalaryRange(salary)?.midpoint ?? null
}

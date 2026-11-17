import type { VacancySalary } from '#shared/types/vacancies'

export function formatVacancySalary(salary: VacancySalary | null) {
  if (!salary) return 'Salary not disclosed'
  // Currency/compact defaults differ between Node and browser ICU versions.
  const formatter = new Intl.NumberFormat('en', { style: 'currency', currency: salary.currency, notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 })
  const period = { YEAR: 'year', MONTH: 'month', HOUR: 'hour' }[salary.period]
  return `${formatter.format(salary.min)}–${formatter.format(salary.max)} / ${period}`
}

export function annualSalaryMidpoint(salary: VacancySalary | null): number | null {
  if (!salary || salary.period === 'HOUR') return null
  const midpoint = (salary.min + salary.max) / 2
  return Math.round(salary.period === 'MONTH' ? midpoint * 12 : midpoint)
}

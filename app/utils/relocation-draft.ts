import type { RelocationDestinationOption, VacancySalary } from '#shared/types/vacancies'
import { annualGrossInputError } from '#shared/utils/relocation-income'
import { annualSalaryRange } from './vacancy-salary'

export type SalaryPoint = 'low' | 'midpoint' | 'high'

export function vacancyEstimateSource(destination: Pick<RelocationDestinationOption, 'key' | 'currency'> | undefined, salary: VacancySalary | null) {
  const range = destination && salary?.currency === destination.currency ? annualSalaryRange(salary) : null
  return {
    location: destination?.key ?? '',
    currency: destination?.currency ?? null,
    salaryCurrency: salary?.currency ?? null,
    period: salary?.period ?? null,
    range,
    annualGross: range && !annualGrossInputError(range.midpoint) ? range.midpoint : null,
  }
}

export type EstimateSource = ReturnType<typeof vacancyEstimateSource>
type EstimateDraft = {
  owner: number | null
  source: EstimateSource
  location: string
  annualGross: number | null
  basis: SalaryPoint | 'manual' | null
  notice: string
}

export function reconcileEstimateDraft(draft: EstimateDraft | undefined, source: EstimateSource, owner: number | null): EstimateDraft {
  const fresh: EstimateDraft = { owner, source, location: source.location, annualGross: source.annualGross, basis: source.annualGross !== null ? 'midpoint' : null, notice: '' }
  if (!draft || draft.owner !== owner) return fresh
  const previous = draft.source
  const sameDestination = previous.location === source.location && previous.currency === source.currency
  if (sameDestination && previous.salaryCurrency === source.salaryCurrency && previous.period === source.period
    && previous.range?.low === source.range?.low && previous.range?.high === source.range?.high) return draft
  if (sameDestination && draft.basis === 'manual' && previous.range && source.range) {
    return { ...draft, source }
  }
  const updated = { ...fresh, notice: 'Vacancy salary or destination changed. Review the updated estimate inputs.' }
  if (sameDestination && draft.location === source.location && draft.basis && draft.basis !== 'manual' && source.range) {
    const amount = source.range[draft.basis]
    return annualGrossInputError(amount) ? { ...updated, annualGross: null, basis: null } : { ...updated, annualGross: amount, basis: draft.basis }
  }
  return updated
}

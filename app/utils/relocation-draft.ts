import type { RelocationDestinationOption, VacancySalary } from '#shared/types/vacancies'
import { annualSalaryMidpoint } from './vacancy-salary'

export function vacancyEstimateSource(destination: Pick<RelocationDestinationOption, 'key' | 'currency'> | undefined, salary: VacancySalary | null) {
  return {
    location: destination?.key ?? '',
    currency: destination?.currency ?? null,
    salaryCurrency: salary?.currency ?? null,
    period: salary?.period ?? null,
    annualGross: destination && salary?.currency === destination.currency ? annualSalaryMidpoint(salary) : null,
  }
}

export type EstimateSource = ReturnType<typeof vacancyEstimateSource>
type EstimateDraft = {
  owner: number | null
  source: EstimateSource
  location: string
  annualGross: number | null
  manualGross: boolean
  notice: string
}

export function reconcileEstimateDraft(draft: EstimateDraft | undefined, source: EstimateSource, owner: number | null): EstimateDraft {
  const fresh = { owner, source, location: source.location, annualGross: source.annualGross, manualGross: false, notice: '' }
  if (!draft || draft.owner !== owner) return fresh
  const previous = draft.source
  const sameDestination = previous.location === source.location && previous.currency === source.currency
  if (sameDestination && previous.salaryCurrency === source.salaryCurrency && previous.period === source.period && previous.annualGross === source.annualGross) return draft
  if (sameDestination && draft.manualGross && previous.annualGross !== null && source.annualGross !== null) {
    return { ...draft, source }
  }
  return { ...fresh, notice: 'Vacancy salary or destination changed. Review the updated estimate inputs.' }
}

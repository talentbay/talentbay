import type { RelocationPreviewResponse } from '#shared/types/vacancies'
import { demoRelocationLocations } from '#server/data/demo-catalog'
import type {
  MonthlyLivingCosts,
  OneTimeRelocationCosts,
  RelocationSource,
  TaxCalculationModel,
} from '#server/db/schema/relocation'

export type RelocationLocationKey = keyof typeof demoRelocationLocations

export function isRelocationLocationKey(value: string): value is RelocationLocationKey {
  return value in demoRelocationLocations
}

export function calculateRelocationPreview(
  locationKey: RelocationLocationKey,
  annualGross: number,
): RelocationPreviewResponse {
  const location = demoRelocationLocations[locationKey]
  const monthlyGross = annualGross / 12
  const netAfterTax = monthlyGross * location.effectiveNetRate
  const disposable = netAfterTax - location.rent - location.livingCosts

  return {
    location: {
      key: location.key,
      city: location.city,
      countryCode: location.countryCode,
      currency: location.currency,
    },
    annualGross,
    monthly: {
      gross: Math.round(monthlyGross),
      netAfterTax: Math.round(netAfterTax),
      rent: location.rent,
      livingCosts: location.livingCosts,
      disposable: Math.round(disposable),
    },
    oneTimeMove: location.oneTimeMove,
    dataStatus: 'DEMO',
    disclaimer: 'Illustrative preview only. Tax and cost data has not yet passed TalentBay legal and data review.',
    provenance: {
      effectiveFrom: null,
      reviewedAt: null,
      sources: [],
    },
  }
}

export type VerifiedRelocationInput = {
  key: string
  city: string
  countryCode: string
  currency: string
  monthlyCosts: MonthlyLivingCosts
  oneTimeCosts: OneTimeRelocationCosts
  taxModel: TaxCalculationModel
  sources: RelocationSource[]
  effectiveFrom: Date
  reviewedAt: Date | null
}

export function calculateVerifiedRelocationPreview(
  location: VerifiedRelocationInput,
  annualGross: number,
): RelocationPreviewResponse {
  const monthlyGross = annualGross / 12
  const annualTax = calculateAnnualTax(location.taxModel, annualGross)
  const netAfterTax = (annualGross - annualTax) / 12
  const { rent, ...otherMonthlyCosts } = location.monthlyCosts
  const livingCosts = sumValues(otherMonthlyCosts)
  const disposable = netAfterTax - rent - livingCosts

  return {
    location: {
      key: location.key,
      city: location.city,
      countryCode: location.countryCode,
      currency: location.currency,
    },
    annualGross,
    monthly: {
      gross: Math.round(monthlyGross),
      netAfterTax: Math.round(netAfterTax),
      rent,
      livingCosts,
      disposable: Math.round(disposable),
    },
    oneTimeMove: sumValues(location.oneTimeCosts),
    dataStatus: 'VERIFIED',
    disclaimer: 'Estimate based on reviewed source data. Actual tax and relocation costs depend on personal circumstances.',
    provenance: {
      effectiveFrom: location.effectiveFrom.toISOString(),
      reviewedAt: location.reviewedAt?.toISOString() ?? null,
      sources: location.sources,
    },
  }
}

export function calculateAnnualTax(model: TaxCalculationModel, annualGross: number): number {
  if (model.type === 'effective_rate') {
    return annualGross * (model.rateBps / 10_000)
  }

  const taxableIncome = Math.max(0, annualGross - model.personalAllowance)
  let previousLimit = 0
  let tax = 0

  for (const bracket of model.brackets) {
    const upperLimit = bracket.upTo ?? Number.POSITIVE_INFINITY
    const amountInBracket = Math.max(
      0,
      Math.min(taxableIncome, upperLimit) - previousLimit,
    )

    tax += amountInBracket * (bracket.rateBps / 10_000)
    previousLimit = upperLimit

    if (taxableIncome <= upperLimit) {
      break
    }
  }

  return tax
}

function sumValues(values: Record<string, number>): number {
  return Object.values(values).reduce((total, value) => total + value, 0)
}

import type { RelocationPreviewResponse } from '#shared/types/vacancies'
import { demoRelocationLocations } from '#server/data/demo-catalog'

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
  }
}

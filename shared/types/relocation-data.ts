import type { RelocationPilotKey } from '../relocation/geography'

export type MonthlyLivingCosts = { rent: number; utilities: number; groceries: number; transport: number; healthcare: number; other: number }
export type OneTimeRelocationCosts = { flight: number; visa: number; deposit: number; temporaryHousing: number; other: number }
export type TaxCalculationModel = { type: 'effective_rate'; rateBps: number } | {
  type: 'progressive'
  personalAllowance: number
  brackets: { upTo: number | null; rateBps: number }[]
}
export type RelocationSource = { label: string; url: string; accessedAt: string }
export type RelocationAssumptions = {
  household: 'ONE_ADULT'
  employment: 'SALARIED_EMPLOYEE'
  taxResidency: string
  taxYear: string
  includedTaxes: string[]
  excludedTaxes: string[]
  housing: string
  moveRoute: string
  exclusions: string[]
}
export type RelocationDatasetSnapshot = {
  schemaVersion: 1
  purpose: 'SYNTHETIC' | 'PILOT'
  record: {
    destination: RelocationPilotKey
    currency: string
    status: 'DRAFT' | 'VERIFIED' | 'STALE'
    monthlyCosts: MonthlyLivingCosts
    oneTimeCosts: OneTimeRelocationCosts
    taxModel: TaxCalculationModel
    sources: (RelocationSource & { covers: ('TAX' | 'RENT' | 'LIVING' | 'MOVE')[] })[]
    effectiveFrom: string
    assumptions: RelocationAssumptions
    review: { at: string; by: string; reference: string; validUntil: string } | null
  }
}

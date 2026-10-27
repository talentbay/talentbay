import type { MonthlyLivingCosts, OneTimeRelocationCosts, RelocationAssumptions } from './relocation-data'

export type VacancyWorkplace = 'ONSITE' | 'HYBRID' | 'REMOTE'
export type VacancyEmployment = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP'
export type VacancyDataStatus = 'DEMO' | 'VERIFIED'

export type RelocationLocationOption = {
  key: string
  city: string
  countryCode: string
  currency: string
  dataStatus: VacancyDataStatus
}

export type RelocationDestinationOption = Omit<RelocationLocationOption, 'dataStatus'> & {
  calculationKey: string | null
  availability: 'REVIEWED' | 'DEMO' | 'UNAVAILABLE'
  pilot: boolean
}
export type RelocationLocationsResponse = { items: RelocationLocationOption[]; total: number; destinations: RelocationDestinationOption[] }

export type VacancySalary = {
  min: number
  max: number
  currency: string
  period: 'YEAR' | 'MONTH' | 'HOUR'
}

export type VacancyListItem = {
  id: number
  applicationContext?: string
  slug: string
  title: string
  summary: string
  description: string
  company: {
    name: string
    initials: string
  }
  location: {
    city: string | null
    countryCode: string
    countryName: string
  }
  workplaceType: VacancyWorkplace
  employmentType: VacancyEmployment
  seniority: string
  salary: VacancySalary | null
  skills: string[]
  relocationOffered: boolean
  visaSponsorship: boolean
  publishedAt: string | null
  provenance?: {
    sourcePublishedAt: string | null
    sourceFetchedAt: string | null
    lastImportedAt: string | null
    reviewedAt: string | null
  }
  source: {
    name: string
    url: string | null
    status: VacancyDataStatus
  }
}

export type VacancySearchResponse = {
  items: VacancyListItem[]
  total: number
  dataStatus: VacancyDataStatus
  nextCursor: string | null
}

export type VacancyResolveResponse = {
  items: VacancyListItem[]
  unavailableSlugs: string[]
}

export type RelocationPreviewResponse = {
  location: {
    key: string
    city: string
    countryCode: string
    currency: string
  }
  annualGross: number
  monthly: {
    gross: number
    netAfterTax: number
    rent: number
    livingCosts: number
    disposable: number
  }
  oneTimeMove: number
  details: { monthlyCosts: MonthlyLivingCosts; oneTimeCosts: OneTimeRelocationCosts; annualTax: number } | null
  dataStatus: VacancyDataStatus
  disclaimer: string
  provenance: {
    effectiveFrom: string | null
    reviewedAt: string | null
    validUntil: string | null
    assumptions: RelocationAssumptions | null
    sources: Array<{
      label: string
      url: string
      accessedAt: string
    }>
  }
}

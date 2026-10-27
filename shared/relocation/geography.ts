// Owner-confirmed pilot coverage; not a claim of sourced/reviewed cost data.
export const relocationPilotCities = [
  { key: 'dubai', city: 'Dubai', countryCode: 'AE', currency: 'AED' },
  { key: 'london', city: 'London', countryCode: 'GB', currency: 'GBP' },
  { key: 'berlin', city: 'Berlin', countryCode: 'DE', currency: 'EUR' },
  { key: 'lisbon', city: 'Lisbon', countryCode: 'PT', currency: 'EUR' },
  { key: 'tallinn', city: 'Tallinn', countryCode: 'EE', currency: 'EUR' },
  { key: 'belgrade', city: 'Belgrade', countryCode: 'RS', currency: 'RSD' },
  { key: 'istanbul', city: 'Istanbul', countryCode: 'TR', currency: 'TRY' },
  { key: 'tbilisi', city: 'Tbilisi', countryCode: 'GE', currency: 'GEL' },
  { key: 'bangkok', city: 'Bangkok', countryCode: 'TH', currency: 'THB' },
  { key: 'buenos-aires', city: 'Buenos Aires', countryCode: 'AR', currency: 'ARS' },
  { key: 'mexico-city', city: 'Mexico City', countryCode: 'MX', currency: 'MXN' },
] as const

export type RelocationPilotKey = typeof relocationPilotCities[number]['key']

import { relocationPilotCities } from '../relocation/geography'
import type { RelocationDestinationOption, RelocationLocationOption } from '../types/vacancies'

export function relocationDestinations(items: RelocationLocationOption[]): RelocationDestinationOption[] {
  const result: RelocationDestinationOption[] = relocationPilotCities.map((city) => {
    const item = items.find(item => item.countryCode === city.countryCode && item.city.toLowerCase() === city.city.toLowerCase())
    return { key: city.key, calculationKey: item?.key ?? null, city: city.city, countryCode: city.countryCode, currency: city.currency, availability: item?.dataStatus === 'VERIFIED' ? 'REVIEWED' : item ? 'DEMO' : 'UNAVAILABLE', pilot: true }
  })
  for (const item of items) {
    if (!result.some(city => city.countryCode === item.countryCode && city.city.toLowerCase() === item.city.toLowerCase())) result.push({ key: item.key, calculationKey: item.key, city: item.city, countryCode: item.countryCode, currency: item.currency, availability: item.dataStatus === 'VERIFIED' ? 'REVIEWED' : 'DEMO', pilot: false })
  }
  return result
}

import { describe, expect, it } from 'vitest'
import { relocationDestinations } from '#shared/utils/relocation-destinations'
import { relocationPilotCities } from '#shared/relocation/geography'
import { relocationDay, relocationMoney } from '../../app/utils/relocation-presentation'

describe('candidate relocation presentation', () => {
  it('shows the eleven confirmed destinations without inventing eleven datasets', () => {
    const destinations = relocationDestinations([])
    expect(destinations.map(item => item.key)).toEqual(relocationPilotCities.map(item => item.key))
    expect(destinations.every(item => item.availability === 'UNAVAILABLE' && item.calculationKey === null && item.pilot)).toBe(true)
  })
  it('keeps stable scenario keys while using reviewed row IDs for calculation', () => {
    const destinations = relocationDestinations([
      { key: 'location-42', city: 'London', countryCode: 'GB', currency: 'GBP', dataStatus: 'VERIFIED' },
      { key: 'berlin', city: 'Berlin', countryCode: 'DE', currency: 'EUR', dataStatus: 'DEMO' },
      { key: 'amsterdam', city: 'Amsterdam', countryCode: 'NL', currency: 'EUR', dataStatus: 'DEMO' },
    ])
    expect(destinations.find(item => item.key === 'london')).toMatchObject({ calculationKey: 'location-42', availability: 'REVIEWED', pilot: true })
    expect(destinations.find(item => item.key === 'berlin')).toMatchObject({ calculationKey: 'berlin', availability: 'DEMO' })
    expect(destinations.find(item => item.key === 'amsterdam')).toMatchObject({ availability: 'DEMO', pilot: false })
    expect(destinations).toHaveLength(12)
  })
  it('formats negative/zero money and unknown dates without a current-date fallback', () => {
    expect(relocationMoney(-3350, 'GBP')).toBe('-£3,350')
    expect(relocationMoney(0, 'EUR')).toBe('€0')
    expect(relocationDay(null)).toBe('Not recorded')
    expect(relocationDay('bad')).toBe('Not recorded')
    expect(relocationDay('2026-01-01T23:59:00-02:00')).toBe('Jan 2, 2026')
  })
})

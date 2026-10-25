import { and, asc, eq } from 'drizzle-orm'
import { demoRelocationLocations } from '#server/data/demo-catalog'
import { isDatabaseConfigured, schema, useDatabase } from '#server/db'
import {
  calculateRelocationPreview,
  calculateVerifiedRelocationPreview,
  isRelocationLocationKey,
} from '#server/services/relocation/calculate-preview'
import type {
  RelocationLocationOption,
  RelocationPreviewResponse,
} from '#shared/types/vacancies'

export async function listRelocationLocations(): Promise<RelocationLocationOption[]> {
  const demoItems = Object.values(demoRelocationLocations).map(location => ({
    key: location.key,
    city: location.city,
    countryCode: location.countryCode,
    currency: location.currency,
    dataStatus: 'DEMO' as const,
  }))

  if (!isDatabaseConfigured()) {
    return demoItems
  }

  const db = useDatabase()
  const rows = await db
    .select({
      id: schema.relocationLocations.id,
      city: schema.relocationLocations.city,
      countryCode: schema.relocationLocations.countryCode,
      currency: schema.relocationLocations.currency,
    })
    .from(schema.relocationLocations)
    .where(eq(schema.relocationLocations.status, 'VERIFIED'))
    .orderBy(asc(schema.relocationLocations.city))

  const verifiedItems = rows.map(row => ({
    key: `location-${row.id}`,
    city: row.city,
    countryCode: row.countryCode,
    currency: row.currency,
    dataStatus: 'VERIFIED' as const,
  }))
  const verifiedCities = new Set(verifiedItems.map(item => `${item.countryCode}:${toLocationKey(item.city)}`))

  return [
    ...verifiedItems,
    ...demoItems.filter(item => !verifiedCities.has(`${item.countryCode}:${item.key}`)),
  ]
}
export async function getRelocationPreview(
  locationKey: string,
  annualGross: number,
): Promise<RelocationPreviewResponse | undefined> {
  if (isDatabaseConfigured()) {
    const db = useDatabase()
    const idMatch = /^location-([1-9]\d*)$/.exec(locationKey)
    if (idMatch && Number(idMatch[1]) > 2_147_483_647) return undefined
    const rows = await db
      .select()
      .from(schema.relocationLocations)
      .where(and(
        eq(schema.relocationLocations.status, 'VERIFIED'),
        idMatch ? eq(schema.relocationLocations.id, Number(idMatch[1])) : undefined,
      ))
    const matches = idMatch ? rows : rows.filter(row => toLocationKey(row.city) === locationKey)
    // Legacy city-only links remain valid only when they identify one destination.
    if (matches.length > 1) return undefined
    const row = matches[0]

    if (row) {
      return calculateVerifiedRelocationPreview({
        key: `location-${row.id}`,
        city: row.city,
        countryCode: row.countryCode,
        currency: row.currency,
        monthlyCosts: row.monthlyCosts,
        oneTimeCosts: row.oneTimeCosts,
        taxModel: row.taxModel,
        sources: row.sources,
        effectiveFrom: row.effectiveFrom,
        reviewedAt: row.reviewedAt,
      }, annualGross)
    }
  }

  return isRelocationLocationKey(locationKey)
    ? calculateRelocationPreview(locationKey, annualGross)
    : undefined
}

export function toLocationKey(city: string): string {
  return city
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

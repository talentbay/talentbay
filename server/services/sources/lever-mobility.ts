import type { LeverPosting } from './lever-contract'
import { leverSectionItem } from './lever-section'

export function postingMobility(job: LeverPosting): 'RELOCATION' | 'WORLDWIDE_REMOTE' | null {
  const evidence = leverSectionItem(job.lists, 'Role mobility')?.toLowerCase()
  if (evidence === 'relocation offered') return 'RELOCATION'
  if (evidence !== 'worldwide remote without country restrictions' || job.workplaceType !== 'remote') return null
  const worldwide = (location: string) => location.trim().toLowerCase() === 'worldwide'
  if (!worldwide(job.categories.location ?? '') || job.categories.allLocations?.some(location => !worldwide(location))) return null
  return 'WORLDWIDE_REMOTE'
}

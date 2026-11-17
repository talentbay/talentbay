import { listRelocationLocations } from '#server/repositories/relocation'
import { relocationDestinations } from '#shared/utils/relocation-destinations'

export default defineEventHandler(async () => {
  const items = await listRelocationLocations()

  return {
    items,
    total: items.length,
    destinations: relocationDestinations(items),
  }
})

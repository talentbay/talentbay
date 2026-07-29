import { listRelocationLocations } from '#server/repositories/relocation'

export default defineEventHandler(async () => {
  const items = await listRelocationLocations()

  return {
    items,
    total: items.length,
  }
})

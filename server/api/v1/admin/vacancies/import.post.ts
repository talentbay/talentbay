import {
  importVacancies,
  vacancyImportRequestSchema,
} from '#server/services/vacancies/import-vacancies'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, value => vacancyImportRequestSchema.parse(value))
  const items = await importVacancies(body.items)

  return {
    items,
    total: items.length,
  }
})

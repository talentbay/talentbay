import { getVacancyBySlug } from '#server/repositories/vacancies'
import { makeVacancyStart, parseVacancyStart } from '#shared/utils/telegram-vacancy-entry'

export default defineEventHandler(async (event) => {
  const pin = getQuery(event).entry
  if (pin !== undefined) {
    setHeader(event, 'cache-control', 'no-store')
    if (!parseVacancyStart(pin)) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })
  }
  const slug = getRouterParam(event, 'slug')
  const vacancy = slug ? await getVacancyBySlug(slug) : undefined

  if (!vacancy || (pin !== undefined && makeVacancyStart(vacancy.id, vacancy.applicationContext) !== pin)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Vacancy not found',
    })
  }

  return vacancy
})

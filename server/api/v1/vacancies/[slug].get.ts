import { getVacancyBySlug } from '#server/repositories/vacancies'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const vacancy = slug ? await getVacancyBySlug(slug) : undefined

  if (!vacancy) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Vacancy not found',
    })
  }

  return vacancy
})

import { describe, expect, it } from 'vitest'
import { makeVacancyStart, parseVacancyStart } from '../../shared/utils/telegram-vacancy-entry'

const tag = '0123456789abcdefdeadbeef'
const revision = 'v1:' + tag + 'a'.repeat(40)

describe('public vacancy navigation payload', () => {
  it.each([1, 2_147_483_647])('round-trips the public ID %s and only the compact material version', id => {
    const start = makeVacancyStart(id, revision)
    expect(start).toBe(`job_${id}_${tag}`)
    expect(start!.length).toBeLessThanOrEqual(64)
    expect(parseVacancyStart(start)).toEqual({ id, revisionTag: tag })
  })
  it('does not issue links for unversioned fixtures or invalid IDs', () => {
    for (const id of [0, -1, 1.5, NaN, Infinity, 2_147_483_648]) expect(makeVacancyStart(id, revision)).toBeNull()
    for (const value of [undefined, null, {}, '', revision.toUpperCase(), revision + 'x', revision + '\n', 'v2:' + '0'.repeat(64)]) {
      expect(makeVacancyStart(42, value)).toBeNull()
    }
  })
  it('ignores incomplete, noncanonical or unsupported start parameters', () => {
    for (const value of [undefined, 42, 'job_1', `job_01_${tag}`, `job_2147483648_${tag}`, `job_1_${tag}\n`,
      `job_0_${tag}`, `job_1_${tag.toUpperCase()}`, `job_1_${tag.slice(1)}`, `job_1_${tag}0`, 'jobs/1']) {
      expect(parseVacancyStart(value)).toBeNull()
    }
  })
})

import { z } from 'zod'
import { leverSourceSchema, SourceFetchError } from './lever-contract'
import type { LeverSource } from './lever-contract'
import { normalizeLeverJobs } from './lever-normalize'

const pageSize = 50
const maxBytes = 2 * 1024 * 1024
const maxPages = 5

async function discard(response: Response) {
  try { await response.body?.cancel() } catch { /* The timeout may already have closed it. */ }
}

async function boundedJson(response: Response) {
  if (!response.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    await discard(response)
    throw new SourceFetchError('CONTENT_TYPE')
  }
  const length = response.headers.get('content-length')
  if (length && Number(length) > maxBytes) { await discard(response); throw new SourceFetchError('BODY_LIMIT') }
  if (!response.body) throw new SourceFetchError('INVALID_JSON')
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) { await reader.cancel(); throw new SourceFetchError('BODY_LIMIT') }
      chunks.push(value)
    }
    const bytes = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown }
    catch { throw new SourceFetchError('INVALID_JSON') }
  } finally { reader.releaseLock() }
}

/** Server-only; callers must approve a real source before using the default network transport. */
export async function fetchLeverJobs(config: LeverSource, transport: typeof fetch = fetch) {
  const source = leverSourceSchema.parse(config)
  const root = source.region === 'EU' ? 'https://api.eu.lever.co' : 'https://api.lever.co'
  const records: unknown[] = []
  const ids = new Set<string>()
  for (let page = 0; page < maxPages; page++) {
    const url = new URL(`/v0/postings/${source.site}`, root)
    url.search = new URLSearchParams({ mode: 'json', skip: String(page * pageSize), limit: String(pageSize) }).toString()
    try {
      const response = await transport(url, { method: 'GET', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(10_000), headers: { accept: 'application/json' } })
      if (response.status === 429) {
        const retry = response.headers.get('retry-after') || ''
        await discard(response)
        throw new SourceFetchError('RATE_LIMIT', /^\d{1,4}$/.test(retry) ? Math.min(Number(retry), 3600) : null)
      }
      if (!response.ok) { await discard(response); throw new SourceFetchError('HTTP') }
      const data = z.array(z.unknown()).max(pageSize).safeParse(await boundedJson(response))
      if (!data.success) throw new SourceFetchError('INVALID_JSON')
      for (const record of data.data) {
        // Detect unstable page repeats before any downstream import can write.
        const id = typeof record === 'object' && record !== null && 'id' in record ? record.id : undefined
        if (typeof id === 'string') {
          if (ids.has(id.toLowerCase())) throw new SourceFetchError('DUPLICATE_ID')
          ids.add(id.toLowerCase())
        }
      }
      records.push(...data.data)
      if (records.length > 200) throw new SourceFetchError('PAGE_LIMIT')
      if (data.data.length < pageSize) return { ...normalizeLeverJobs(source, records), pageCount: page + 1, fetchedAt: new Date().toISOString() }
    } catch (error) {
      if (error instanceof SourceFetchError) throw error
      throw new SourceFetchError('NETWORK')
    }
  }
  throw new SourceFetchError('PAGE_LIMIT')
}

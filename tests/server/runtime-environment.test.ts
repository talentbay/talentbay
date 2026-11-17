import { describe, expect, it } from 'vitest'
import { getServerRuntime } from '../../server/utils/runtime-environment'

describe('runtime environment', () => {
  it('detects an explicit Cloudflare Worker runtime', () => {
    expect(getServerRuntime({
      TALENTBAY_RUNTIME: 'cloudflare',
    })).toBe('cloudflare')
  })

  it('detects Vercel when the Cloudflare marker is absent', () => {
    expect(getServerRuntime({
      VERCEL: '1',
    })).toBe('vercel')
  })

  it('defaults local and generic Node runtimes to node', () => {
    expect(getServerRuntime({})).toBe('node')
  })
})

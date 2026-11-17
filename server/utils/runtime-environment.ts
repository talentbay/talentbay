export type ServerRuntime = 'cloudflare' | 'vercel' | 'node'

type RuntimeEnvironment = Record<string, string | undefined>

export function getServerRuntime(
  environment: RuntimeEnvironment = process.env,
): ServerRuntime {
  if (
    environment.TALENTBAY_RUNTIME === 'cloudflare'
    || environment.CF_PAGES === '1'
  ) {
    return 'cloudflare'
  }

  if (environment.VERCEL === '1') {
    return 'vercel'
  }

  return 'node'
}

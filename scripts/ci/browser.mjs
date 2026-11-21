import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { chromium, webkit } from '@playwright/test'

export async function ensureBrowser({ engine = 'chromium', launch = () => ({ chromium, webkit })[engine].launch(), install = target => execFileSync('pnpm', ['exec', 'playwright', 'install-deps', target], { stdio: 'inherit', timeout: 600_000 }), platform = process.platform } = {}) {
  if (!['chromium', 'webkit'].includes(engine)) throw new Error('Unsupported browser probe')
  try {
    const browser = await launch()
    await browser.close()
    return 'ready'
  } catch (error) {
    // Avoid blanket apt upgrades on ready runners, without ignoring a missing library.
    if (platform !== 'linux' || !/Host system is missing dependencies|error while loading shared libraries/.test(String(error?.message))) throw error
    install(engine)
    const browser = await launch()
    await browser.close()
    return 'installed-system-dependencies'
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const engine = process.argv[2] ?? 'chromium'
  console.log(`${engine} startup: ${await ensureBrowser({ engine })}.`)
}

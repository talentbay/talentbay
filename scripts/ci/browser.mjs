import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

export async function ensureBrowser({ launch = () => chromium.launch(), install = () => execFileSync('pnpm', ['exec', 'playwright', 'install-deps', 'chromium'], { stdio: 'inherit', timeout: 600_000 }), platform = process.platform } = {}) {
  try {
    const browser = await launch()
    await browser.close()
    return 'ready'
  } catch (error) {
    // Avoid blanket apt upgrades on ready runners, without ignoring a missing library.
    if (platform !== 'linux' || !/Host system is missing dependencies|error while loading shared libraries/.test(String(error?.message))) throw error
    install()
    const browser = await launch()
    await browser.close()
    return 'installed-system-dependencies'
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(`Chromium startup: ${await ensureBrowser()}.`)
}

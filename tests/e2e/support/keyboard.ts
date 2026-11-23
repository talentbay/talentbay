import { expect } from '@playwright/test'
import type { Locator } from '@playwright/test'

async function settleDialog(dialog: Locator) {
  await dialog.evaluate(async el => {
    const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    // The modal enters with a scale animation. Its transient bounding box is not
    // the baseline for either viewport restoration or a repeated resize.
    await frame()
    await frame()
    const transitions = el.getAnimations().filter(animation =>
      animation.playState === 'running' && Number.isFinite(animation.effect?.getComputedTiming().endTime),
    )
    await Promise.allSettled(transitions.map(animation => animation.finished))
    await frame()
  })
}

// WebKit emulation has no software keyboard. Change only visual viewport metrics
// so the real focus handler and the actual modal layout handle the obstruction.
export async function checkKeyboardReveal(field: Locator, height: number) {
  await field.focus()
  const page = field.page(), dialog = page.getByRole('dialog').filter({ has: field.page().locator(':focus') })
  await settleDialog(dialog)
  const original = await dialog.boundingBox()
  const pageY = await page.evaluate(() => window.scrollY)
  try {
    await page.evaluate(height => {
      const view = window.visualViewport!
      Object.defineProperties(view, { height: { configurable: true, value: height }, offsetTop: { configurable: true, value: 24 } })
      view.dispatchEvent(new Event('resize'))
    }, height)
    await expect.poll(() => field.evaluate((el, height) => {
      const r = el.getBoundingClientRect(), d = el.closest('[role="dialog"]')!.getBoundingClientRect()
      const b = el.closest('[data-slot="body"]')!.getBoundingClientRect()
      return d.top >= 23 && d.bottom <= 25 + height && r.top >= Math.max(d.top, b.top) && r.bottom <= Math.min(d.bottom, b.bottom)
    }, height)).toBe(true)
    await expect(field).toBeFocused()
    expect(await page.evaluate(() => window.scrollY)).toBe(pageY)
    await settleDialog(dialog)
    const y = (await field.boundingBox())!.y
    await page.evaluate(async () => {
      window.visualViewport!.dispatchEvent(new Event('resize'))
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    })
    expect((await field.boundingBox())!.y).toBeCloseTo(y, 0)
  } finally {
    await page.evaluate(() => {
      const view = window.visualViewport!
      Reflect.deleteProperty(view, 'height')
      Reflect.deleteProperty(view, 'offsetTop')
      view.dispatchEvent(new Event('resize'))
    })
  }
  await expect.poll(async () => Math.round((await dialog.boundingBox())!.height)).toBe(Math.round(original!.height))
}

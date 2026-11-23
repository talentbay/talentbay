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

// A field can be fully visible only two pixels from the scroll boundary.
// Switching focus there must not move it just to create extra padding.
export async function checkVisibleFocusTransfer(dialog: Locator, from: Locator, to: Locator) {
  const page = from.page()
  await settleDialog(dialog)
  try {
    await page.evaluate(() => {
      Object.defineProperty(window.visualViewport!, 'height', { configurable: true, value: 480 })
      window.visualViewport!.dispatchEvent(new Event('resize'))
    })
    await expect(dialog).toHaveAttribute('data-form-viewport', '')
    await from.focus()
    const initial = await to.evaluate(el => {
      const scroller = el.closest('[data-slot="body"]')!
      scroller.scrollTop += el.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 2
      const gap = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top
      el.focus({ preventScroll: true })
      return { gap, scroll: scroller.scrollTop }
    })
    expect(initial.gap).toBeGreaterThanOrEqual(1)
    expect(initial.gap).toBeLessThanOrEqual(3)
    await expect(to).toBeFocused()
    // Sample past the quiet period as well as during any corrective animation.
    const offsets = await to.evaluate(async el => {
      const body = el.closest('[data-slot="body"]')!
      const samples = [], until = performance.now() + 450
      do {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
        samples.push(body.scrollTop)
      } while (performance.now() < until)
      return samples
    })
    expect(offsets.every(n => n === initial.scroll)).toBe(true)
  } finally {
    await page.evaluate(() => {
      Reflect.deleteProperty(window.visualViewport!, 'height')
      window.visualViewport!.dispatchEvent(new Event('resize'))
    })
    await expect(dialog).not.toHaveAttribute('data-form-viewport', '')
  }
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
      return { visible: d.top >= 23 && d.bottom <= 25 + height && r.top >= Math.max(d.top, b.top) && r.bottom <= Math.min(d.bottom, b.bottom),
        field: [r.top, r.bottom], dialog: [d.top, d.bottom], body: [b.top, b.bottom] }
    }, height)).toEqual(expect.objectContaining({ visible: true }))
    await expect(field).toBeFocused()
    expect(await page.evaluate(() => window.scrollY)).toBe(pageY)
    await settleDialog(dialog)
    const y = (await field.boundingBox())!.y
    const positions = await field.evaluate(async el => {
      window.visualViewport!.dispatchEvent(new Event('resize'))
      const samples = [], until = performance.now() + 450
      do {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
        samples.push(el.getBoundingClientRect().y)
      } while (performance.now() < until)
      return samples
    })
    expect(Math.max(...positions.map(position => Math.abs(position - y)))).toBeLessThan(0.5)
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

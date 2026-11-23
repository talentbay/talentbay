// The modal is portalled; scroll its body, not the document behind it.
export function useKeyboardForm() {
  const form = useTemplateRef<HTMLFormElement>('keyboardForm')
  watchEffect((onCleanup) => {
    const element = form.value
    const dialog = element?.closest<HTMLElement>('[role="dialog"]')
    const body = element?.closest<HTMLElement>('[data-slot="body"]')
    if (!element || !dialog || !body || !window.matchMedia('(pointer: coarse)').matches) return
    const viewport = window.visualViewport
    if (!viewport) return
    let frame = 0
    let revealTimer = 0

    function update() {
      frame = 0
      if (!viewport || !dialog || !element || !body || Math.abs(viewport.scale - 1) > 0.01) return
      const top = Math.max(0, viewport.offsetTop)
      const height = viewport.height
      if (height <= 0) return
      const clipped = height < document.documentElement.clientHeight - 1
      if (clipped) {
        dialog.style.setProperty('--form-visible-center', (top + height / 2) + 'px')
        dialog.style.setProperty('--form-visible-height', height + 'px')
      }
      dialog.toggleAttribute('data-form-viewport', clipped)
      // In landscape the fixed header and footer can consume all available space.
      const compact = height < 300
      dialog.toggleAttribute('data-short-form', compact)
    }

    function reveal() {
      if (!viewport || !dialog || !element || !body || Math.abs(viewport.scale - 1) > 0.01
        || !dialog.hasAttribute('data-form-viewport')) return
      const field = document.activeElement
      if (!(field instanceof HTMLElement) || !element.contains(field) || !field.matches('input:not([type="checkbox"]), textarea')) return
      const scroller = dialog.hasAttribute('data-short-form') ? dialog : body
      const bounds = scroller.getBoundingClientRect()
      const rect = field.getBoundingClientRect()
      const start = Math.max(bounds.top, viewport.offsetTop)
      const end = Math.min(bounds.bottom, viewport.offsetTop + viewport.height)
      if (end <= start || (rect.top >= start && rect.bottom <= end) || (rect.top <= start && rect.bottom >= end)) return
      const inset = Math.min(8, Math.max(0, (end - start - rect.height) / 2))
      const delta = rect.top < start ? rect.top - start - inset : Math.min(rect.top - start, rect.bottom - end + inset)
      scroller.scrollBy({ top: delta, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
      // Let WebKit finish its own keyboard pan before correcting the inner scroller.
      window.clearTimeout(revealTimer)
      revealTimer = window.setTimeout(reveal, 100)
    }
    element.addEventListener('focusin', schedule)
    viewport.addEventListener('resize', schedule)
    viewport.addEventListener('scroll', schedule)
    schedule()
    onCleanup(() => {
      cancelAnimationFrame(frame)
      window.clearTimeout(revealTimer)
      viewport.removeEventListener('resize', schedule)
      viewport.removeEventListener('scroll', schedule)
      element.removeEventListener('focusin', schedule)
      dialog.removeAttribute('data-form-viewport')
      dialog.removeAttribute('data-short-form')
      dialog.style.removeProperty('--form-visible-center')
      dialog.style.removeProperty('--form-visible-height')
    })
  }, { flush: 'post' })
}

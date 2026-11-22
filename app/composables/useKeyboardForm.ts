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
      const field = document.activeElement
      if (!(field instanceof HTMLElement) || !element.contains(field) || !field.matches('input:not([type="checkbox"]), textarea')) return
      const scroller = compact ? dialog : body
      const bounds = scroller.getBoundingClientRect()
      const rect = field.getBoundingClientRect()
      const start = bounds.top + 8, end = bounds.bottom - 8
      if (rect.top < start && rect.bottom < end) scroller.scrollTop += rect.top - start
      else if (rect.bottom > end && rect.top > start) scroller.scrollTop += Math.min(rect.top - start, rect.bottom - end)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    element.addEventListener('focusin', schedule)
    viewport.addEventListener('resize', schedule)
    viewport.addEventListener('scroll', schedule)
    schedule()
    onCleanup(() => {
      cancelAnimationFrame(frame)
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

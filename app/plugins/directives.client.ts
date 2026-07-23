export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('intersect', {
    mounted(el: HTMLElement) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            el.classList.add('is-visible')
            observer.unobserve(el)
          }
        },
        { threshold: 0.1 },
      )

      observer.observe(el)
    },
  })
})

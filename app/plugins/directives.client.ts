export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.directive('intersect', {
        mounted(el) {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    // @ts-ignore
                    if (entry.isIntersecting) {
                        el.classList.add('is-visible')
                        observer.unobserve(el)
                    }
                },
                { threshold: 0.1 }
            )
            observer.observe(el)
        }
    })
})
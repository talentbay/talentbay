import { refDebounced } from '@vueuse/core'
import type { Ref } from 'vue'
import type { RelocationLocationsResponse, RelocationPreviewResponse } from '#shared/types/vacancies'
import { relocationDestinations } from '#shared/utils/relocation-destinations'
import { annualGrossInputError } from '#shared/utils/relocation-income'

type EstimateProps = { contextKey: string; initialLocation: string; initialAnnualGross: number | null }
export function useRelocationEstimate(props: EstimateProps, locations: Ref<RelocationLocationsResponse | undefined>) {
  const { user } = useUserSession()
  const owner = computed(() => user.value?.id ?? null)
  const initial = () => ({ location: props.initialLocation, annualGross: props.initialAnnualGross, owner: owner.value })
  const inputs = useState(`relocation-inputs:${props.contextKey}`, initial)
  if (inputs.value.owner !== owner.value) inputs.value = initial()
  const location = computed({ get: () => inputs.value.location, set: value => { inputs.value.location = value } })
  const annualGross = computed({ get: () => inputs.value.annualGross, set: value => { inputs.value.annualGross = value } })
  const notice = ref('')
  const destinations = computed(() => locations.value?.destinations ?? relocationDestinations(locations.value?.items ?? []))
  watch(destinations, (items) => {
    const match = items.find(item => item.calculationKey === location.value)
    if (match && match.key !== location.value) location.value = match.key
  }, { immediate: true })
  const selected = computed(() => destinations.value.find(item => item.key === location.value))
  const supported = computed(() => Boolean(selected.value?.calculationKey))
  let resetting = false
  watch(() => selected.value?.currency, (currency, previous) => {
    if (!resetting && currency && previous && currency !== previous) {
      annualGross.value = null
      notice.value = `Enter an annual amount in ${currency}.`
    }
  }, { flush: 'sync' })
  watch(() => selected.value?.availability, (availability, previous) => {
    if (!resetting && previous === 'REVIEWED' && availability !== 'REVIEWED') {
      annualGross.value = null
      notice.value = 'Reviewed data changed. The previous result was cleared.'
    }
  }, { flush: 'sync' })
  watch(owner, () => { resetting = true; inputs.value = initial(); notice.value = ''; resetting = false }, { flush: 'sync' })
  const incomeError = computed(() => annualGrossInputError(annualGross.value))
  const valid = computed(() => supported.value && typeof annualGross.value === 'number' && !incomeError.value)
  const debouncedGross = refDebounced(annualGross, 300)
  const query = computed(() => ({ location: selected.value?.calculationKey, annualGross: debouncedGross.value }))
  const settled = computed(() => valid.value && debouncedGross.value === annualGross.value)
  const resource = useFetch<RelocationPreviewResponse>('/api/v1/relocation/preview', {
    key: `relocation-estimate:${props.contextKey}`, query, enabled: settled, watch: [settled], timeout: 15_000,
  })
  const currentResult = computed(() => resource.data.value && settled.value
    && resource.data.value.location.key === selected.value?.calculationKey
    && resource.data.value.location.currency === selected.value?.currency
    && resource.data.value.annualGross === annualGross.value ? resource.data.value : null)
  // Both responsive presentations share Nuxt's request/deduplication boundary.
  watch(settled, (value) => { if (!value) resource.clear() }, { flush: 'sync' })
  const updating = computed(() => valid.value && (resource.status.value === 'pending' || !settled.value))
  return { location, annualGross, destinations, selected, supported, valid, incomeError, notice, currentResult, updating, resource }
}

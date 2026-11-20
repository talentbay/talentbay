import { refDebounced } from '@vueuse/core'
import type { Ref } from 'vue'
import type { RelocationLocationsResponse, RelocationPreviewResponse } from '#shared/types/vacancies'
import { relocationDestinations } from '#shared/utils/relocation-destinations'
import { annualGrossInputError } from '#shared/utils/relocation-income'
import { reconcileEstimateDraft, type EstimateSource } from '~/utils/relocation-draft'

type LocationsResource = {
  data: Ref<RelocationLocationsResponse | undefined>
  error: Readonly<Ref<unknown>>
  refresh: () => Promise<void>
}
export function useRelocationEstimate(scope: string, source: () => EstimateSource, locations: LocationsResource) {
  const { user } = useUserSession()
  const owner = computed(() => user.value?.id ?? null)
  const inputs = useState(`relocation-draft:${scope}`, () => reconcileEstimateDraft(undefined, source(), owner.value))
  let resetting = false
  watch([source, owner], ([current, account]) => {
    resetting = true
    inputs.value = reconcileEstimateDraft(inputs.value, current, account)
    resetting = false
  }, { immediate: true, flush: 'sync' })
  const location = computed({ get: () => inputs.value.location, set: value => { inputs.value.location = value } })
  const markIncomeEdited = () => { inputs.value.manualGross = true }
  const annualGross = computed({
    get: () => inputs.value.annualGross,
    set: (value) => { markIncomeEdited(); inputs.value.annualGross = value },
  })
  const notice = computed(() => inputs.value.notice)
  function clearIncome(message: string) {
    inputs.value.annualGross = null
    inputs.value.manualGross = false
    inputs.value.notice = message
  }
  const destinations = computed(() => locations.data.value?.destinations ?? relocationDestinations(locations.data.value?.items ?? []))
  watch(destinations, (items) => {
    const match = items.find(item => item.calculationKey === location.value)
    if (match && match.key !== location.value) location.value = match.key
  }, { immediate: true })
  const selected = computed(() => destinations.value.find(item => item.key === location.value))
  const supported = computed(() => Boolean(selected.value?.calculationKey))
  watch(() => selected.value?.currency, (currency, previous) => {
    if (!resetting && currency && previous && currency !== previous) {
      clearIncome(`Enter an annual amount in ${currency}.`)
    }
  }, { flush: 'sync' })
  watch(() => selected.value?.availability, (availability, previous) => {
    if (!resetting && previous === 'REVIEWED' && availability !== 'REVIEWED') {
      clearIncome('Reviewed data changed. The previous result was cleared.')
    }
  }, { flush: 'sync' })
  const incomeError = computed(() => annualGrossInputError(annualGross.value))
  const valid = computed(() => supported.value && typeof annualGross.value === 'number' && !incomeError.value)
  const debouncedGross = refDebounced(annualGross, 300)
  const body = computed(() => ({ location: selected.value?.calculationKey, annualGross: debouncedGross.value }))
  const settled = computed(() => valid.value && debouncedGross.value === annualGross.value)
  const resource = useFetch<RelocationPreviewResponse>('/api/v1/relocation/preview', {
    key: `relocation-estimate:${scope}`,
    // Even a vacancy-prefilled estimate is a same-origin browser POST, never an SSR subrequest.
    server: false, method: 'POST', body, headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
    enabled: settled, watch: [settled], timeout: 15_000,
  })
  const currentResult = computed(() => resource.data.value && settled.value
    && resource.data.value.location.key === selected.value?.calculationKey
    && resource.data.value.location.currency === selected.value?.currency
    && resource.data.value.annualGross === annualGross.value ? resource.data.value : null)
  // Both responsive presentations share Nuxt's request/deduplication boundary.
  watch(settled, (value) => { if (!value) resource.clear() }, { flush: 'sync' })
  const updating = computed(() => valid.value && (resource.status.value === 'idle' || resource.status.value === 'pending' || !settled.value))
  return { location, annualGross, markIncomeEdited, destinations, selected, supported, valid, incomeError, notice, currentResult, updating, resource, locationsError: locations.error, refreshLocations: locations.refresh }
}

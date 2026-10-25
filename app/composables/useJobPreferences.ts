export type JobPreferences = { countryCode: string, visaSponsorship: boolean, salaryDisclosed: boolean }
export const defaultJobPreferences = (): JobPreferences => ({ countryCode: 'all', visaSponsorship: false, salaryDisclosed: false })
export const jobCountries = [
  { label: 'All locations', value: 'all' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'Netherlands', value: 'NL' },
  { label: 'Germany', value: 'DE' },
  { label: 'Portugal', value: 'PT' },
]
export function useJobPreferences() {
  return useState<JobPreferences>('job-preferences', defaultJobPreferences)
}

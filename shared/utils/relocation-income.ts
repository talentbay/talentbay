export const maxAnnualGross = 2_000_000
export const annualGrossPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/

// A cleared number input can emit an empty string; it is not zero and is not an error.
export function annualGrossInputError(value: unknown): string | undefined {
  if (value == null || value === '') return
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > maxAnnualGross) {
    return 'Enter an amount from 0 to 2,000,000.'
  }
  if (!annualGrossPattern.test(String(value))) return 'Use no more than two decimal places.'
}

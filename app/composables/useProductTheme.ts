export type ProductTheme = 'system' | 'light' | 'dark'

export function useProductTheme() {
  return useState<ProductTheme>('product-theme-preference', () => 'system')
}

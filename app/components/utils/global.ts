import { resolveComponent } from 'vue'

export function diff<T extends Record<string, unknown>>(original: T, updated: T): Partial<T> {
  return Object.keys(updated).reduce<Partial<T>>((result, key) => {
    const typedKey = key as keyof T

    if (original[typedKey] !== updated[typedKey]) {
      result[typedKey] = updated[typedKey]
    }

    return result
  }, {})
}

export const getIcon = (name: string) => {
  const pascal = name
    .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
    .replace(/^\w/, c => c.toUpperCase())

  return resolveComponent(`${pascal}Icon`)
}

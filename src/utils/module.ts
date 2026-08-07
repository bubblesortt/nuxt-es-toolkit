export const toArray = <T>(value: T | T[] | null | undefined): T[] => {
  if (value === null || typeof value === 'undefined') {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

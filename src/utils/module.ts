export const toArray = <T>(value: T | T[] | null | undefined): T[] => {
  if (value === null || typeof value === 'undefined') {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

export const upperFirst = (value: string): string => {
  if (!value) {
    return ''
  }
  return `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}`
}

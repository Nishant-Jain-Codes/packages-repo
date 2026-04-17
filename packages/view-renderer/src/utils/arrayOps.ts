type AnyObj = Record<string, unknown>

/**
 * Move an item from one index to another, returning a new array.
 */
export function reorderItem<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...arr]
  const [item] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, item)
  return result
}

/**
 * Update fields on the item matching identityKey === identityValue.
 */
export function updateItemField(
  arr: AnyObj[],
  identityKey: string,
  identityValue: unknown,
  updates: Record<string, unknown>,
): AnyObj[] {
  return arr.map((item) =>
    item[identityKey] === identityValue ? { ...item, ...updates } : item,
  )
}

/**
 * Toggle a boolean field on the item matching identityKey === identityValue.
 */
export function toggleItem(
  arr: AnyObj[],
  identityKey: string,
  identityValue: unknown,
  toggleKey: string,
): AnyObj[] {
  return arr.map((item) =>
    item[identityKey] === identityValue
      ? { ...item, [toggleKey]: !item[toggleKey] }
      : item,
  )
}

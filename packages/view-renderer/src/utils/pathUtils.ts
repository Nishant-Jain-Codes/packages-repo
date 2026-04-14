/**
 * Dot-path utilities for reading/writing nested objects immutably.
 *
 * Constraints:
 * - Keys must NOT contain dots (all existing keys use underscores)
 * - Array indices are NOT supported in paths — arrays are addressed as whole values
 */

type AnyObj = Record<string, unknown>

/**
 * Read a value at a dot-separated path.
 * Returns `undefined` if any intermediate segment is missing.
 *
 * getByPath(obj, "brand")                           → obj.brand
 * getByPath(obj, "features.home.config.must_do_actions") → obj.features.home.config.must_do_actions
 */
export function getByPath(obj: unknown, path: string): unknown {
  const segments = path.split('.')
  let current: unknown = obj
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as AnyObj)[seg]
  }
  return current
}

/**
 * Immutably set a value at a dot-separated path.
 * Creates intermediate objects if they don't exist.
 *
 * setByPath(draft, "brand.primary_color", "#FF0000")
 *   → { ...draft, brand: { ...draft.brand, primary_color: "#FF0000" } }
 */
export function setByPath<T extends AnyObj>(obj: T, path: string, value: unknown): T {
  const segments = path.split('.')
  if (segments.length === 0) return obj

  const [head, ...rest] = segments

  if (rest.length === 0) {
    return { ...obj, [head]: value }
  }

  const child = ((obj[head] ?? {}) as AnyObj)
  return { ...obj, [head]: setByPath(child, rest.join('.'), value) }
}

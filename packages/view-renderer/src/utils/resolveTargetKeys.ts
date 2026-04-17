import type { AppTypeKey } from '../types'

/**
 * Resolve which config keys a field/child targets.
 * Cascade: field-level > node-level > all keys in map.
 */
export function resolveTargetKeys(
  fieldKeys: AppTypeKey[] | undefined,
  nodeKeys: AppTypeKey[] | undefined,
  allKeys: AppTypeKey[],
): AppTypeKey[] {
  return fieldKeys ?? nodeKeys ?? allKeys
}

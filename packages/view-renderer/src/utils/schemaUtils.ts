import type { GlobalFeatureConfig, GlobalConfigField } from '../types'

export interface ResolvedField {
  key: string
  type: string
  label: string
  description: string
  default_value?: unknown
  editor?: string
  readonly: boolean
  item_fields?: GlobalConfigField[]
}

export interface ConfigEditorChildInput {
  key: string
  label?: string
  editor?: string
  readonly?: boolean
}

/**
 * Look up schema fields from global config by feature_id,
 * optionally navigating into nested item_fields via schema_field_path.
 *
 * resolveSchemaFields(globals, "_brand")
 *   → fields from the _brand feature config
 *
 * resolveSchemaFields(globals, "home", "must_do_actions")
 *   → item_fields of the "must_do_actions" field inside the "home" feature config
 */
export function resolveSchemaFields(
  globalConfigs: GlobalFeatureConfig[],
  schemaFeatureId: string,
  schemaFieldPath?: string,
): GlobalConfigField[] | null {
  const feature = globalConfigs.find((g) => g.feature_id === schemaFeatureId)
  if (!feature) return null

  let fields = feature.fields
  if (!schemaFieldPath) return fields

  // Walk the field path to find nested fields
  const segments = schemaFieldPath.split('.')
  for (const seg of segments) {
    const field = fields.find((f) => f.key === seg)
    if (!field) return null
    if (field.item_fields) {
      fields = field.item_fields
    } else {
      return null
    }
  }

  return fields
}

/**
 * Merge schema fields with optional children overrides.
 *
 * - If children is omitted/empty → return all schema fields in schema order
 * - If children is provided → return only those fields, in children order, with overrides applied
 */
export function mergeFieldOverrides(
  schemaFields: GlobalConfigField[],
  children?: ConfigEditorChildInput[],
): ResolvedField[] {
  if (!children || children.length === 0) {
    return schemaFields.map((f) => ({
      key: f.key,
      type: f.type,
      label: f.label,
      description: f.description,
      default_value: f.default_value,
      editor: undefined,
      readonly: false,
      item_fields: f.item_fields,
    }))
  }

  const result: ResolvedField[] = []
  for (const c of children) {
    const schemaField = schemaFields.find((f) => f.key === c.key)
    if (!schemaField) continue
    result.push({
      key: schemaField.key,
      type: schemaField.type,
      label: c.label ?? schemaField.label,
      description: schemaField.description,
      default_value: schemaField.default_value,
      editor: c.editor,
      readonly: c.readonly ?? false,
      item_fields: schemaField.item_fields,
    })
  }
  return result
}

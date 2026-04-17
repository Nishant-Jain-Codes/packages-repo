import type { ViewMeta, DraftMap, ActivityFieldTag } from '../types'
import { resolveTargetKeys } from '../utils/resolveTargetKeys'

export interface ActivityCardItem {
  id: string
  label: string
  description: string
  enabled: boolean
  fields: ActivityFieldTag[]
}

/**
 * Extract field tags from either explicit `fields` on the child,
 * or from the form schema inside `activity_default.config.schema`.
 */
function extractFieldTags(child: {
  fields?: ActivityFieldTag[]
  activity_default?: Record<string, unknown>
}): ActivityFieldTag[] {
  // Explicit fields take priority
  if (child.fields?.length) return child.fields

  // Derive from embedded form schema
  const config = child.activity_default?.config as Record<string, unknown> | undefined
  const schema = config?.schema as { sections?: { fields?: { label: string; type: string }[] }[] } | undefined
  if (!schema?.sections) return []

  const tags: ActivityFieldTag[] = []
  for (const section of schema.sections) {
    for (const field of section.fields ?? []) {
      tags.push({ label: field.label, type: field.type as ActivityFieldTag['type'] })
    }
  }
  return tags
}

export function deriveActivityCards(
  viewMeta: ViewMeta,
  draftMap: DraftMap,
  activeNodeId: string,
): ActivityCardItem[] {
  const node = viewMeta.nodes.find((n) => n.node_id === activeNodeId)
  if (!node || node.node_type !== 'store_activity') return []

  const allKeys = Object.keys(draftMap)

  return node.children.map((child) => {
    const targetKeys = resolveTargetKeys(child.target_config_keys, node.target_config_keys, allKeys)
    const enabled = targetKeys.every(
      (key) => draftMap[key]?.features[child.activity_id]?.enabled === true,
    )
    return {
      id: child.activity_id,
      label: child.activity_label,
      description: child.activity_description,
      enabled,
      fields: extractFieldTags(child),
    }
  })
}

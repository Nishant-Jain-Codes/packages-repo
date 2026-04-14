import type { ViewMeta, TenantConfig, ActivityFieldTag } from '../types'

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
  draft: TenantConfig,
  activeNodeId: string,
): ActivityCardItem[] {
  const node = viewMeta.nodes.find((n) => n.node_id === activeNodeId)
  if (!node || node.node_type !== 'store_activity') return []

  return node.children.map((child) => ({
    id: child.activity_id,
    label: child.activity_label,
    description: child.activity_description,
    enabled: draft.features[child.activity_id]?.enabled === true,
    fields: extractFieldTags(child),
  }))
}

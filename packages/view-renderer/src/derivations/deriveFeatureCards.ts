import type { ViewMeta, TenantConfig } from '../types'
import type { FeatureCardItem } from '../components/MiddleContent'

export function deriveFeatureCards(
  viewMeta: ViewMeta,
  draft: TenantConfig,
  activeNodeId: string,
): FeatureCardItem[] {
  const node = viewMeta.nodes.find((n) => n.node_id === activeNodeId)
  if (!node || node.node_type !== 'feature_selection') return []

  return node.children.map((child) => ({
    id: child.feature_id,
    label: child.feature_label,
    description: child.feature_description,
    enabled: draft.features[child.feature_id]?.enabled === true,
  }))
}

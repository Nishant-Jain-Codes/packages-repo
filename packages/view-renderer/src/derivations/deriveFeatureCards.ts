import type { ViewMeta, DraftMap } from '../types'
import type { FeatureCardItem } from '../components/MiddleContent'
import { resolveTargetKeys } from '../utils/resolveTargetKeys'

export function deriveFeatureCards(
  viewMeta: ViewMeta,
  draftMap: DraftMap,
  activeNodeId: string,
): FeatureCardItem[] {
  const node = viewMeta.nodes.find((n) => n.node_id === activeNodeId)
  if (!node || node.node_type !== 'feature_selection') return []

  const allKeys = Object.keys(draftMap)

  return node.children.map((child) => {
    const targetKeys = resolveTargetKeys(child.target_config_keys, node.target_config_keys, allKeys)
    const enabled = targetKeys.every(
      (key) => draftMap[key]?.features[child.feature_id]?.enabled === true,
    )
    return {
      id: child.feature_id,
      label: child.feature_label,
      description: child.feature_description,
      enabled,
    }
  })
}

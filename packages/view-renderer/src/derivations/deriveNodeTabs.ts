import type { ViewMeta } from '../types'
import type { NodeTab } from '../components/TopToggleList'

export function deriveNodeTabs(viewMeta: ViewMeta): NodeTab[] {
  return viewMeta.nodes.map((node) => ({
    id: node.node_id,
    label: node.node_label,
    logo: node.node_logo || undefined,
  }))
}

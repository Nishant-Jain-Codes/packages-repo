import type { CSSProperties, ReactNode } from 'react'
import type { ConfigEditorNodeMeta, NodeMeta } from '../types'
import { useViewRenderer } from '../context/ViewRendererContext'
import { ConfigEditorRenderer } from './ConfigEditorRenderer'
import { StoreActivityRenderer } from './StoreActivityRenderer'

export interface FeatureCardItem {
  id: string
  label: string
  description: string
  enabled: boolean
}

export interface MiddleContentProps {
  nodeType?: string
  features?: FeatureCardItem[]
  onToggleFeature?: (featureId: string, enabled: boolean) => void
  renderNode?: (node: NodeMeta) => ReactNode | null
}

const styles = {
  container: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 0',
  } as CSSProperties,
  description: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  } as CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  } as CSSProperties,
  card: (enabled: boolean): CSSProperties => ({
    cursor: 'pointer',
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    transition: 'all 0.15s ease',
    border: enabled ? '1px solid rgba(13, 148, 136, 0.3)' : '1px solid #e5e7eb',
    background: enabled ? 'rgba(13, 148, 136, 0.08)' : '#f9fafb',
  }),
  checkbox: (enabled: boolean): CSSProperties => ({
    width: 16,
    height: 16,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
    background: enabled ? '#0d9488' : 'transparent',
    border: enabled ? 'none' : '2px solid #9ca3af',
    transition: 'all 0.15s ease',
  }),
  checkIcon: {
    width: 10,
    height: 10,
    color: '#fff',
  } as CSSProperties,
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: '#111827',
  } as CSSProperties,
  desc: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: '1.4',
  } as CSSProperties,
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    fontSize: 13,
  } as CSSProperties,
}

function CheckIcon() {
  return (
    <svg
      style={styles.checkIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function FeatureSelectionRenderer({ features = [], onToggleFeature }: {
  features: FeatureCardItem[]
  onToggleFeature?: (featureId: string, enabled: boolean) => void
}) {
  return (
    <div>
      <p style={styles.description}>
        Toggle features on/off for your application.
      </p>
      <div style={styles.grid}>
        {features.map((feature) => (
          <div
            key={feature.id}
            onClick={() => onToggleFeature?.(feature.id, !feature.enabled)}
            style={styles.card(feature.enabled)}
          >
            <div style={styles.checkbox(feature.enabled)}>
              {feature.enabled && <CheckIcon />}
            </div>
            <div>
              <div style={styles.label}>{feature.label}</div>
              <div style={styles.desc}>{feature.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MiddleContent({ nodeType, features, onToggleFeature, renderNode }: MiddleContentProps) {
  const ctx = useViewRenderer()

  // Custom renderer override — checked before node_type switch
  if (renderNode && ctx.currentNodeMeta) {
    const custom = renderNode(ctx.currentNodeMeta)
    if (custom !== null) {
      return <div style={styles.container}>{custom}</div>
    }
  }

  const resolvedNodeType = nodeType ?? ctx.currentNodeMeta?.node_type
  const resolvedFeatures = features ?? ctx.featureCards
  const resolvedOnToggle = onToggleFeature ?? ctx.handleToggleFeature

  if (!resolvedNodeType) {
    return <div style={styles.empty}>Select a node</div>
  }

  if (resolvedNodeType === 'feature_selection') {
    return (
      <div style={styles.container}>
        <FeatureSelectionRenderer
          features={resolvedFeatures}
          onToggleFeature={resolvedOnToggle}
        />
      </div>
    )
  }

  if (resolvedNodeType === 'store_activity') {
    return (
      <div style={styles.container}>
        <StoreActivityRenderer
          activities={ctx.activityCards}
          onToggleActivity={ctx.handleToggleActivity}
          onAdvancedSettings={ctx.handleAdvancedSettings}
        />
      </div>
    )
  }

  if (resolvedNodeType === 'config_editor') {
    const nodeMeta = ctx.currentNodeMeta as ConfigEditorNodeMeta | null
    if (!nodeMeta) return <div style={styles.empty}>No node selected</div>
    return (
      <div style={styles.container}>
        <ConfigEditorRenderer node={nodeMeta} />
      </div>
    )
  }

  return (
    <div style={styles.empty}>
      No renderer for node type: {resolvedNodeType}
    </div>
  )
}

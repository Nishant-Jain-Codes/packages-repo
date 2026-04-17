import type { CSSProperties } from 'react'
import type { ConfigEditorNodeMeta } from '../types'
import { useViewRenderer } from '../context/ViewRendererContext'
import { getByPath } from '../utils/pathUtils'
import { resolveTargetKeys } from '../utils/resolveTargetKeys'
import { FieldRenderer } from './FieldRenderer'

export interface ConfigEditorRendererProps {
  node: ConfigEditorNodeMeta
}

const styles = {
  container: {
    padding: '4px 0',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
  } as CSSProperties,
  empty: {
    padding: 24,
    textAlign: 'center' as const,
    color: '#9ca3af',
    fontSize: 13,
  } as CSSProperties,
}

export function ConfigEditorRenderer({ node }: ConfigEditorRendererProps) {
  const { draftMap, handleUpdateDraft } = useViewRenderer()
  const fields = node.config
  const allKeys = draftMap ? Object.keys(draftMap) : []

  if (!fields || fields.length === 0) {
    return <div style={styles.empty}>No fields configured for this node.</div>
  }

  return (
    <div style={styles.container}>
      {fields.map((field) => {
        const targetKeys = resolveTargetKeys(field.target_config_keys, node.target_config_keys, allKeys)
        const primaryKey = targetKeys[0]
        const primaryDraft = primaryKey && draftMap ? draftMap[primaryKey] : null
        const currentValue = primaryDraft ? getByPath(primaryDraft, field.target_path) : undefined
        return (
          <FieldRenderer
            key={field.field_id}
            field={field}
            value={currentValue}
            onChange={(value) => handleUpdateDraft(field.target_path, value, targetKeys)}
          />
        )
      })}
    </div>
  )
}

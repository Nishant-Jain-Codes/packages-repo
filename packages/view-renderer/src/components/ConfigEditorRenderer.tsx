import type { CSSProperties } from 'react'
import type { ConfigEditorNodeMeta } from '../types'
import { useViewRenderer } from '../context/ViewRendererContext'
import { getByPath } from '../utils/pathUtils'
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
  const { draft, handleUpdateDraft } = useViewRenderer()
  const fields = node.config

  if (!fields || fields.length === 0) {
    return <div style={styles.empty}>No fields configured for this node.</div>
  }

  return (
    <div style={styles.container}>
      {fields.map((field) => {
        const currentValue = draft ? getByPath(draft, field.target_path) : undefined
        return (
          <FieldRenderer
            key={field.field_id}
            field={field}
            value={currentValue}
            onChange={(value) => handleUpdateDraft(field.target_path, value)}
          />
        )
      })}
    </div>
  )
}

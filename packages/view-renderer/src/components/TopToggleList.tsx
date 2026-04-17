import type { CSSProperties } from 'react'
import { useViewRenderer } from '../context/ViewRendererContext'

export interface NodeTab {
  id: string
  label: string
  logo?: string
}

export interface TopToggleListProps {
  items?: NodeTab[]
  activeId?: string
  onSelect?: (id: string) => void
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '12px 0',
    borderBottom: '1px solid #e5e7eb',
    overflowX: 'auto',
    flexShrink: 0,
  } as CSSProperties,
  tab: (isActive: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.15s ease',
    flexShrink: 0,
    background: isActive ? '#0d9488' : 'transparent',
    color: isActive ? '#fff' : '#6b7280',
  }),
  logo: {
    width: 16,
    height: 16,
    flexShrink: 0,
  } as CSSProperties,
}

export function TopToggleList({ items, activeId, onSelect }: TopToggleListProps) {
  const ctx = useViewRenderer()
  const resolvedItems = items ?? ctx.nodeTabs
  const resolvedActiveId = activeId ?? ctx.activeNodeId
  const resolvedOnSelect = onSelect ?? ctx.handleSelectNode

  if (resolvedItems.length === 0) return null

  return (
    <div style={styles.container}>
      {resolvedItems.map((item) => {
        const isActive = item.id === resolvedActiveId
        return (
          <button
            key={item.id}
            onClick={() => resolvedOnSelect?.(item.id)}
            style={styles.tab(isActive)}
          >
            {item.logo && (
              <img src={item.logo} alt="" style={styles.logo} />
            )}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

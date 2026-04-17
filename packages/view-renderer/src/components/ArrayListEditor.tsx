import { useState, useRef, type CSSProperties } from 'react'
import type { ConfigEditorField } from '../types'
import { reorderItem, updateItemField, toggleItem } from '../utils/arrayOps'
import { FieldRenderer } from './FieldRenderer'

type AnyObj = Record<string, unknown>

export interface ArrayListEditorProps {
  fields: ConfigEditorField[]
  items: AnyObj[]
  identityKey: string
  labelKey?: string
  subtitleKey?: string
  toggleKey?: string
  sortable?: boolean
  onItemsChange: (items: AnyObj[]) => void
}

// ── Icons ──

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="9" cy="6" r="1" fill="currentColor" /><circle cx="15" cy="6" r="1" fill="currentColor" />
      <circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" />
      <circle cx="9" cy="18" r="1" fill="currentColor" /><circle cx="15" cy="18" r="1" fill="currentColor" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 15-6-6-6 6" />
    </svg>
  )
}

// ── Styles ──

const S = {
  container: {
    padding: '4px 0',
  } as CSSProperties,
  heading: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  } as CSSProperties,
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  } as CSSProperties,
  card: (enabled: boolean, expanded: boolean, isDragging: boolean, isDragOver: boolean): CSSProperties => ({
    borderRadius: 10,
    overflow: 'hidden',
    transition: isDragging ? 'none' : 'all 0.15s ease',
    border: expanded
      ? '1.5px solid rgba(13,148,136,0.35)'
      : isDragOver
        ? '1.5px dashed rgba(13,148,136,0.4)'
        : enabled
          ? '1px solid rgba(13,148,136,0.2)'
          : '1px solid #e5e7eb',
    background: isDragging
      ? 'rgba(13,148,136,0.04)'
      : enabled
        ? 'rgba(13,148,136,0.03)'
        : '#fafafa',
    opacity: enabled ? 1 : 0.65,
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
  }),
  header: {
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as CSSProperties,
  dragHandle: (enabled: boolean): CSSProperties => ({
    cursor: enabled ? 'grab' : 'default',
    padding: 4,
    borderRadius: 4,
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.1s ease',
    opacity: enabled ? 1 : 0.3,
  }),
  toggle: (on: boolean): CSSProperties => ({
    width: 38,
    height: 22,
    borderRadius: 11,
    background: on ? '#0d9488' : '#d1d5db',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    flexShrink: 0,
  }),
  toggleKnob: (on: boolean): CSSProperties => ({
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    position: 'absolute',
    top: 2,
    left: on ? 18 : 2,
    transition: 'left 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  }),
  indexBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 700,
    background: 'rgba(13,148,136,0.15)',
    color: '#0d9488',
    flexShrink: 0,
  } as CSSProperties,
  labelCol: {
    flex: 1,
    minWidth: 0,
  } as CSSProperties,
  itemLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: '#111827',
  } as CSSProperties,
  itemSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  } as CSSProperties,
  settingsBtn: (expanded: boolean): CSSProperties => ({
    width: 32,
    height: 32,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s ease',
    background: expanded ? 'rgba(13,148,136,0.15)' : '#f3f4f6',
    color: expanded ? '#0d9488' : '#9ca3af',
  }),
  activeBadge: {
    fontSize: 10,
    fontWeight: 500,
    padding: '3px 10px',
    borderRadius: 10,
    color: '#0d9488',
    background: 'rgba(13,148,136,0.1)',
    flexShrink: 0,
    whiteSpace: 'nowrap' as const,
  } as CSSProperties,
  expandedBody: {
    borderTop: '1px solid #e5e7eb',
    padding: '16px 16px',
  } as CSSProperties,
  sectionLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: 8,
  } as CSSProperties,
  empty: {
    padding: 24,
    textAlign: 'center' as const,
    color: '#9ca3af',
    fontSize: 13,
  } as CSSProperties,
}

// ── Component ──

export function ArrayListEditor({
  fields,
  items,
  identityKey,
  labelKey,
  subtitleKey,
  toggleKey,
  sortable = true,
  onItemsChange,
}: ArrayListEditorProps) {
  const [expandedId, setExpandedId] = useState<unknown>(null)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragCounterRef = useRef(0)

  if (!items || items.length === 0) {
    return <div style={S.empty}>No items configured.</div>
  }

  // ── Drag handlers ──

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx)
  }

  const handleDragEnter = (idx: number) => {
    dragCounterRef.current++
    if (draggedIdx !== null && draggedIdx !== idx) {
      setDragOverIdx(idx)
    }
  }

  const handleDragLeave = () => {
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setDragOverIdx(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (idx: number) => {
    if (draggedIdx !== null && draggedIdx !== idx) {
      onItemsChange(reorderItem(items, draggedIdx, idx))
    }
    setDraggedIdx(null)
    setDragOverIdx(null)
    dragCounterRef.current = 0
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
    setDragOverIdx(null)
    dragCounterRef.current = 0
  }

  // ── Other handlers ──

  const handleToggle = (identityValue: unknown) => {
    if (!toggleKey) return
    onItemsChange(toggleItem(items, identityKey, identityValue, toggleKey))
  }

  const handleFieldChange = (identityValue: unknown, key: string, value: unknown) => {
    onItemsChange(updateItemField(items, identityKey, identityValue, { [key]: value }))
  }

  return (
    <div style={S.container}>
      <p style={S.heading}>Manage list items — reorder by dragging, toggle, or expand to edit.</p>
      <div style={S.list}>
        {items.map((item, idx) => {
          const id = item[identityKey]
          const isExpanded = expandedId === id
          const label = labelKey ? String(item[labelKey] ?? id) : String(id)
          const subtitle = subtitleKey ? String(item[subtitleKey] ?? '') : ''
          const isOn = toggleKey ? Boolean(item[toggleKey]) : true
          const isDragging = draggedIdx === idx
          const isDragOver = dragOverIdx === idx

          return (
            <div
              key={String(id)}
              style={S.card(isOn, isExpanded, isDragging, isDragOver)}
              draggable={sortable}
              onDragStart={() => sortable && handleDragStart(idx)}
              onDragEnter={() => sortable && handleDragEnter(idx)}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={() => sortable && handleDrop(idx)}
              onDragEnd={handleDragEnd}
            >
              {/* ── Header ── */}
              <div style={S.header}>
                {/* Drag handle */}
                {sortable && (
                  <div style={S.dragHandle(isOn)}>
                    <GripIcon />
                  </div>
                )}

                {/* Toggle */}
                {toggleKey && (
                  <div
                    style={S.toggle(isOn)}
                    onClick={(e) => { e.stopPropagation(); handleToggle(id) }}
                  >
                    <div style={S.toggleKnob(isOn)} />
                  </div>
                )}

                {/* Index badge */}
                <div style={S.indexBadge}>{idx + 1}</div>

                {/* Content */}
                <div style={S.labelCol}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={S.itemLabel}>{label}</span>
                    {subtitle && <span style={S.itemSubtitle}>— {subtitle}</span>}
                  </div>
                </div>

                {/* Settings button */}
                <button
                  style={S.settingsBtn(isExpanded)}
                  onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : id) }}
                  title="Advanced Settings"
                >
                  {isExpanded ? <ChevronUpIcon /> : <SettingsIcon />}
                </button>

                {/* Active badge */}
                {isOn && !isExpanded && (
                  <span style={S.activeBadge}>Active</span>
                )}
              </div>

              {/* ── Expanded Settings ── */}
              {isExpanded && (
                <div style={S.expandedBody}>
                  <div style={S.sectionLabel}>Advanced Settings</div>
                  {fields.map((field) => {
                    const leafKey = field.target_path.split('.').pop() ?? field.field_id
                    return (
                      <FieldRenderer
                        key={field.field_id}
                        field={field}
                        value={item[leafKey]}
                        onChange={(val) => handleFieldChange(id, leafKey, val)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

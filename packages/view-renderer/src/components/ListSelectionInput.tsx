import { useState, useRef, useMemo, type CSSProperties } from 'react'
import type { ConfigEditorField, ListSelectionOption } from '../types'
import { reorderItem, updateItemField } from '../utils/arrayOps'
import { FieldRenderer } from './FieldRenderer'

type AnyObj = Record<string, unknown>

export interface ListSelectionInputProps {
  field: ConfigEditorField
  items: AnyObj[]
  onChange: (items: AnyObj[]) => void
}

interface DisplayItem {
  id: string
  label: string
  description: string
  enabled: boolean
  item: AnyObj | null
  option: ListSelectionOption | null
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

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

// ── Styles ──

const S = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  } as CSSProperties,
  description: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
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
  labelCol: {
    flex: 1,
    minWidth: 0,
  } as CSSProperties,
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as CSSProperties,
  idBadge: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#9ca3af',
    background: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: 4,
    flexShrink: 0,
    whiteSpace: 'nowrap' as const,
  } as CSSProperties,
  itemLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: '#111827',
  } as CSSProperties,
  itemDesc: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  } as CSSProperties,
  pillRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  } as CSSProperties,
  pillLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: '#9ca3af',
    marginRight: 2,
  } as CSSProperties,
  pill: {
    fontSize: 10,
    color: '#6b7280',
    background: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    whiteSpace: 'nowrap' as const,
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
  labelInputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    display: 'block' as const,
  } as CSSProperties,
  labelInput: {
    maxWidth: 320,
    width: '100%',
    padding: '7px 12px',
    fontSize: 13,
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    outline: 'none',
    background: '#f3f4f6',
    color: '#111827',
    boxSizing: 'border-box' as const,
  } as CSSProperties,
  chipRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  } as CSSProperties,
  chip: (active: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 12,
    fontWeight: 500,
    padding: '5px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: active ? '1px solid rgba(13,148,136,0.3)' : '1px solid #e5e7eb',
    background: active ? 'rgba(13,148,136,0.1)' : '#f3f4f6',
    color: active ? '#0d9488' : '#9ca3af',
  }),
  empty: {
    padding: 24,
    textAlign: 'center' as const,
    color: '#9ca3af',
    fontSize: 13,
  } as CSSProperties,
}

// ── Helpers ──

function getDatapoints(kpi: AnyObj): AnyObj[] {
  const dp = kpi.datapoints as Record<string, unknown> | undefined
  if (!dp) return []
  const main = Array.isArray(dp.main) ? dp.main : []
  const footer = Array.isArray(dp.footer) ? dp.footer : []
  return [...main, ...footer] as AnyObj[]
}

function getFooterDatapoints(kpi: AnyObj): AnyObj[] {
  const dp = kpi.datapoints as Record<string, unknown> | undefined
  if (!dp) return []
  return (Array.isArray(dp.footer) ? dp.footer : []) as AnyObj[]
}

function getMainDatapoints(kpi: AnyObj): AnyObj[] {
  const dp = kpi.datapoints as Record<string, unknown> | undefined
  if (!dp) return []
  return (Array.isArray(dp.main) ? dp.main : []) as AnyObj[]
}

// ── Component ──

export function ListSelectionInput({ field, items, onChange }: ListSelectionInputProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragCounterRef = useRef(0)
  const identityKey = field.identity_key ?? 'id'
  const options = field.list_options ?? []

  // Build display list: enabled items in tenant order, then available items
  const displayList = useMemo<DisplayItem[]>(() => {
    const enabledIds = new Set(items.map((it) => String(it[identityKey])))
    const optionMap = new Map(options.map((o) => [o.id, o]))

    const enabled: DisplayItem[] = items.map((it) => {
      const id = String(it[identityKey])
      const opt = optionMap.get(id)
      return {
        id,
        label: String(it.label ?? opt?.label ?? id),
        description: opt?.description ?? '',
        enabled: true,
        item: it,
        option: opt ?? null,
      }
    })

    const available: DisplayItem[] = options
      .filter((o) => !enabledIds.has(o.id))
      .map((o) => ({
        id: o.id,
        label: o.label,
        description: o.description ?? '',
        enabled: false,
        item: null,
        option: o,
      }))

    return [...enabled, ...available]
  }, [items, options, identityKey])

  // ── Drag handlers ──

  const handleDragStart = (enabledIdx: number) => {
    setDraggedIdx(enabledIdx)
  }

  const handleDragEnter = (enabledIdx: number) => {
    dragCounterRef.current++
    if (draggedIdx !== null && draggedIdx !== enabledIdx) {
      setDragOverIdx(enabledIdx)
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

  const handleDrop = (enabledIdx: number) => {
    if (draggedIdx !== null && draggedIdx !== enabledIdx) {
      onChange(reorderItem(items, draggedIdx, enabledIdx))
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

  const handleToggle = (id: string, currentlyEnabled: boolean) => {
    if (currentlyEnabled) {
      onChange(items.filter((it) => String(it[identityKey]) !== id))
      if (expandedId === id) setExpandedId(null)
    } else {
      const opt = options.find((o) => o.id === id)
      if (!opt) return
      const clone = structuredClone(opt.default_config)
      if ('enabled' in clone) clone.enabled = true
      onChange([...items, clone])
    }
  }

  const handleLabelChange = (id: string, newLabel: string) => {
    onChange(updateItemField(items, identityKey, id, { label: newLabel }))
  }

  const handleItemFieldChange = (id: string, key: string, value: unknown) => {
    onChange(updateItemField(items, identityKey, id, { [key]: value }))
  }

  const handleToggleDatapoint = (kpiId: string, dpId: string, section: 'main' | 'footer') => {
    const kpiIdx = items.findIndex((it) => String(it[identityKey]) === kpiId)
    if (kpiIdx < 0) return

    const kpi = items[kpiIdx]
    const dp = (kpi.datapoints ?? {}) as Record<string, unknown>
    const currentArr = (Array.isArray(dp[section]) ? dp[section] : []) as AnyObj[]

    const exists = currentArr.some((d) => d.id === dpId)
    let newArr: AnyObj[]

    if (exists) {
      newArr = currentArr.filter((d) => d.id !== dpId)
    } else {
      const opt = options.find((o) => o.id === kpiId)
      if (!opt) return
      const defaultDp = (opt.default_config.datapoints as Record<string, unknown>)?.[section]
      if (!Array.isArray(defaultDp)) return
      const dpObj = (defaultDp as AnyObj[]).find((d) => d.id === dpId)
      if (!dpObj) return
      newArr = [...currentArr, structuredClone(dpObj)]
    }

    const updatedKpi = { ...kpi, datapoints: { ...dp, [section]: newArr } }
    const newItems = [...items]
    newItems[kpiIdx] = updatedKpi
    onChange(newItems)
  }

  if (options.length === 0 && items.length === 0) {
    return <div style={S.empty}>No options configured.</div>
  }

  return (
    <div>
      {field.description && <p style={S.description}>{field.description}</p>}
      <div style={S.container}>
        {displayList.map((di) => {
          const isExpanded = expandedId === di.id
          const enabledIdx = di.enabled
            ? items.findIndex((it) => String(it[identityKey]) === di.id)
            : -1
          const isDragging = draggedIdx === enabledIdx && di.enabled
          const isDragOver = dragOverIdx === enabledIdx && di.enabled

          // Datapoints
          const activeDps = di.item ? getDatapoints(di.item) : []
          const allMainDps = di.option
            ? getMainDatapoints(di.option.default_config)
            : di.item ? getMainDatapoints(di.item) : []
          const allFooterDps = di.option
            ? getFooterDatapoints(di.option.default_config)
            : di.item ? getFooterDatapoints(di.item) : []
          const activeMainIds = new Set(di.item ? getMainDatapoints(di.item).map((d) => d.id) : [])
          const activeFooterIds = new Set(di.item ? getFooterDatapoints(di.item).map((d) => d.id) : [])

          return (
            <div
              key={di.id}
              style={S.card(di.enabled, isExpanded, isDragging, isDragOver)}
              draggable={di.enabled}
              onDragStart={() => di.enabled && handleDragStart(enabledIdx)}
              onDragEnter={() => di.enabled && handleDragEnter(enabledIdx)}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={() => di.enabled && handleDrop(enabledIdx)}
              onDragEnd={handleDragEnd}
            >
              {/* ── Header ── */}
              <div style={S.header}>
                {/* Drag handle */}
                <div style={S.dragHandle(di.enabled)}>
                  <GripIcon />
                </div>

                {/* Toggle */}
                <div
                  style={S.toggle(di.enabled)}
                  onClick={() => handleToggle(di.id, di.enabled)}
                >
                  <div style={S.toggleKnob(di.enabled)} />
                </div>

                {/* Content */}
                <div style={S.labelCol}>
                  <div style={S.nameRow}>
                    <span style={S.idBadge}>{di.id}</span>
                    <span style={S.itemLabel}>{di.label}</span>
                  </div>
                  {di.description && <div style={S.itemDesc}>{di.description}</div>}
                  {di.enabled && activeDps.length > 0 && !isExpanded && (
                    <div style={S.pillRow}>
                      <span style={S.pillLabel}>Data points:</span>
                      {activeDps.map((dp) => (
                        <span key={String(dp.id)} style={S.pill}>{String(dp.label || dp.id)}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Settings button (enabled only) */}
                {di.enabled && (
                  <button
                    style={S.settingsBtn(isExpanded)}
                    onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : di.id) }}
                    title="Advanced Settings"
                  >
                    {isExpanded ? <ChevronUpIcon /> : <SettingsIcon />}
                  </button>
                )}

                {/* Active badge (when not expanded) */}
                {di.enabled && !isExpanded && (
                  <span style={S.activeBadge}>Active</span>
                )}
              </div>

              {/* ── Advanced Settings ── */}
              {isExpanded && di.enabled && di.item && (
                <div style={S.expandedBody}>
                  <div style={S.sectionLabel}>Advanced Settings</div>

                  {/* Dynamic fields from item_fields (tasks, etc.) */}
                  {field.item_fields && field.item_fields.length > 0 ? (
                    field.item_fields.map((subField) => {
                      const leafKey = subField.target_path.split('.').pop() ?? subField.field_id
                      return (
                        <FieldRenderer
                          key={subField.field_id}
                          field={subField}
                          value={di.item![leafKey]}
                          onChange={(val) => handleItemFieldChange(di.id, leafKey, val)}
                        />
                      )
                    })
                  ) : (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <label style={S.labelInputLabel}>Label</label>
                        <input
                          style={S.labelInput}
                          value={String(di.item.label ?? '')}
                          onChange={(e) => handleLabelChange(di.id, e.target.value)}
                        />
                      </div>

                      {(allMainDps.length > 0 || allFooterDps.length > 0) && (
                        <div>
                          <label style={S.labelInputLabel}>Data Points / Metrics</label>
                          <div style={S.chipRow}>
                            {allMainDps.map((dp) => {
                              const dpId = String(dp.id)
                              const active = activeMainIds.has(dpId)
                              return (
                                <span
                                  key={`main_${dpId}`}
                                  style={S.chip(active)}
                                  onClick={() => handleToggleDatapoint(di.id, dpId, 'main')}
                                >
                                  {active && <CheckIcon />}
                                  {String(dp.label || dpId)}
                                </span>
                              )
                            })}
                            {allFooterDps.map((dp) => {
                              const dpId = String(dp.id)
                              const active = activeFooterIds.has(dpId)
                              return (
                                <span
                                  key={`footer_${dpId}`}
                                  style={S.chip(active)}
                                  onClick={() => handleToggleDatapoint(di.id, dpId, 'footer')}
                                >
                                  {active && <CheckIcon />}
                                  {String(dp.label || dpId)}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

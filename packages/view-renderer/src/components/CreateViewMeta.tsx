import { useState, type CSSProperties } from 'react'
import type {
  CreateViewMetaProps,
  GlobalFeatureConfig,
  GlobalConfigField,
  FeatureSelectionState,
  ConfigEditorField,
} from '../types'

// ── Types ──

interface ConfigNodeState {
  nodeId: string
  nodeLabel: string
  nodeDescription: string
  fields: ConfigEditorField[]
}

interface FieldPickerState {
  nodeIndex: number
  featureId: string
  fieldKey: string
}

// ── Styles ──

const S = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: 16,
  } as CSSProperties,
  heading: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
    marginBottom: 4,
  } as CSSProperties,
  subheading: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
  } as CSSProperties,
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  } as CSSProperties,
  stepDot: (active: boolean, done: boolean): CSSProperties => ({
    width: 24,
    height: 24,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 600,
    background: active ? '#0d9488' : done ? '#0d9488' : '#e5e7eb',
    color: active || done ? '#fff' : '#6b7280',
    opacity: done && !active ? 0.6 : 1,
    transition: 'all 0.15s ease',
  }),
  stepLine: {
    width: 32,
    height: 2,
    background: '#e5e7eb',
    borderRadius: 1,
  } as CSSProperties,
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  } as CSSProperties,
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 4,
  } as CSSProperties,
  input: {
    fontSize: 13,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '8px 12px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  } as CSSProperties,
  textarea: {
    fontSize: 12,
    fontFamily: 'monospace',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '8px 12px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 60,
    resize: 'vertical',
  } as CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
    marginBottom: 16,
  } as CSSProperties,
  card: (selected: boolean): CSSProperties => ({
    borderRadius: 8,
    padding: 12,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: selected ? '1px solid rgba(13, 148, 136, 0.3)' : '1px solid #e5e7eb',
    background: selected ? 'rgba(13, 148, 136, 0.08)' : '#f9fafb',
  }),
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  } as CSSProperties,
  checkbox: (checked: boolean): CSSProperties => ({
    width: 16,
    height: 16,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
    background: checked ? '#0d9488' : 'transparent',
    border: checked ? 'none' : '2px solid #9ca3af',
    transition: 'all 0.15s ease',
  }),
  checkIcon: {
    width: 10,
    height: 10,
    color: '#fff',
  } as CSSProperties,
  featureId: {
    fontSize: 11,
    fontWeight: 600,
    color: '#0f766e',
    fontFamily: 'monospace',
  } as CSSProperties,
  featureName: {
    fontSize: 12,
    fontWeight: 500,
    color: '#111827',
    marginTop: 2,
  } as CSSProperties,
  featureDesc: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: '1.4',
  } as CSSProperties,
  stats: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  } as CSSProperties,
  editSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  } as CSSProperties,
  editLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: '#6b7280',
    marginBottom: 2,
  } as CSSProperties,
  editInput: {
    fontSize: 12,
    border: '1px solid #d1d5db',
    borderRadius: 4,
    padding: '6px 8px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  } as CSSProperties,
  editTextarea: {
    fontSize: 11,
    fontFamily: 'monospace',
    border: '1px solid #d1d5db',
    borderRadius: 4,
    padding: '6px 8px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 48,
    resize: 'vertical',
  } as CSSProperties,
  jsonError: {
    fontSize: 10,
    color: '#ef4444',
    marginTop: 2,
  } as CSSProperties,
  btnRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 16,
    borderTop: '1px solid #e5e7eb',
    flexShrink: 0,
  } as CSSProperties,
  btnPrimary: (disabled: boolean): CSSProperties => ({
    fontSize: 13,
    fontWeight: 500,
    padding: '8px 20px',
    borderRadius: 6,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    background: '#0d9488',
    color: '#fff',
    transition: 'all 0.15s ease',
  }),
  btnSecondary: {
    fontSize: 13,
    fontWeight: 500,
    padding: '8px 20px',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    cursor: 'pointer',
    background: '#f3f4f6',
    color: '#374151',
    transition: 'all 0.15s ease',
  } as CSSProperties,
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    fontSize: 13,
  } as CSSProperties,
  // Step 3 styles
  nodeCard: {
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    background: '#fff',
    marginBottom: 12,
    overflow: 'hidden',
  } as CSSProperties,
  nodeHeader: {
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
  } as CSSProperties,
  nodeTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: 600,
    color: '#111827',
  } as CSSProperties,
  nodeBadge: {
    fontSize: 10,
    color: '#6b7280',
    background: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: 10,
    border: '1px solid #e5e7eb',
  } as CSSProperties,
  removeBtn: {
    fontSize: 11,
    color: '#ef4444',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 4,
  } as CSSProperties,
  nodeBody: {
    padding: 14,
  } as CSSProperties,
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 6,
    background: '#f9fafb',
    border: '1px solid #f3f4f6',
    marginBottom: 6,
    fontSize: 12,
  } as CSSProperties,
  fieldId: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#0f766e',
    fontWeight: 500,
    minWidth: 100,
    flexShrink: 0,
  } as CSSProperties,
  fieldType: {
    fontSize: 10,
    color: '#6b7280',
    background: '#e5e7eb',
    padding: '1px 6px',
    borderRadius: 4,
    flexShrink: 0,
  } as CSSProperties,
  fieldPath: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#9ca3af',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as CSSProperties,
  fieldRemove: {
    fontSize: 14,
    color: '#d1d5db',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
    flexShrink: 0,
  } as CSSProperties,
  pickerRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
    marginTop: 10,
  } as CSSProperties,
  select: {
    fontSize: 12,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '6px 10px',
    outline: 'none',
    background: '#fff',
    color: '#374151',
    minWidth: 120,
  } as CSSProperties,
  addBtn: {
    fontSize: 12,
    fontWeight: 500,
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px dashed #d1d5db',
    cursor: 'pointer',
    background: '#fafafa',
    color: '#6b7280',
    transition: 'all 0.15s ease',
  } as CSSProperties,
  addNodeBtn: {
    fontSize: 13,
    fontWeight: 500,
    padding: '10px 20px',
    borderRadius: 8,
    border: '1.5px dashed #d1d5db',
    cursor: 'pointer',
    background: '#fafafa',
    color: '#6b7280',
    transition: 'all 0.15s ease',
    width: '100%',
    marginBottom: 16,
  } as CSSProperties,
  jsonFieldArea: {
    fontSize: 11,
    fontFamily: 'monospace',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '8px 10px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    minHeight: 80,
    resize: 'vertical' as const,
    marginTop: 6,
  } as CSSProperties,
  orDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '8px 0',
    fontSize: 10,
    color: '#9ca3af',
  } as CSSProperties,
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#e5e7eb',
  } as CSSProperties,
}

function CheckIcon() {
  return (
    <svg
      style={S.checkIcon}
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

// ── Helpers ──

function initFeatureStates(configs: GlobalFeatureConfig[]): Record<string, FeatureSelectionState> {
  const states: Record<string, FeatureSelectionState> = {}
  for (const gc of configs) {
    states[gc.feature_id] = {
      selected: false,
      featureLabel: gc.display_name,
      featureDescription: gc.description,
      featureDefaultJson: '{}',
    }
  }
  return states
}

function guessInputType(featureId: string, fieldKey: string, fieldType: string): ConfigEditorField['input_type'] {
  if (/color/i.test(fieldKey)) return 'color_picker'
  if (/blob_key|logo|banner/i.test(fieldKey) && !/asset_path|base_url/i.test(fieldKey)) return 'image_upload'
  if (fieldType === 'boolean') return 'toggle'
  if (fieldType === 'integer' || fieldType === 'number') return 'number'
  if (fieldType === 'list') return 'list_editor'
  return 'text'
}

function inferIdentityKey(itemFields: GlobalConfigField[]): string {
  const candidates = ['type', 'id', 'key', 'code']
  for (const c of candidates) {
    if (itemFields.some((f) => f.key === c)) return c
  }
  return itemFields[0]?.key ?? 'id'
}

function inferDisplayKey(itemFields: GlobalConfigField[], hint: string): string | undefined {
  return itemFields.some((f) => f.key === hint) ? hint : undefined
}

function inferToggleKey(itemFields: GlobalConfigField[]): string | undefined {
  return itemFields.some((f) => f.key === 'enabled' && f.type === 'boolean') ? 'enabled' : undefined
}

function buildItemFields(
  featureId: string,
  parentKey: string,
  itemFields: GlobalConfigField[],
): ConfigEditorField[] {
  return itemFields.map((f) => ({
    field_id: `${featureId}_${parentKey}_${f.key}`,
    target_path: `features.${featureId}.config.${parentKey}.*.${f.key}`,
    label: f.label,
    description: f.description,
    input_type: guessInputType(featureId, f.key, f.type),
    default_value: f.default_value,
  }))
}

function buildDefaultTasks(): Record<string, unknown>[] {
  return [
    {
      type: 'sales_target',
      enabled: true,
      label: 'SALES TARGET',
      subtitle: 'Must Achieve Today',
      metric: 'SALES_AMOUNT',
      period: 'DAILY',
      avg_sales_days: 7,
      show_incentive: false,
      unit: '\u20B9',
      color: '#17C3B2',
    },
    {
      type: 'must_order',
      enabled: true,
      label: 'MUST ORDER',
      subtitle: 'Must Bill Today',
      metric: 'SALES_UNITS',
      period: 'DAILY',
      avg_sales_days: 7,
      show_incentive: false,
      unit: '',
      color: '#e04a0b',
    },
    {
      type: 'focus_products',
      enabled: false,
      label: 'FOCUS PRODUCTS',
      subtitle: 'Focus Products To Be Sold',
      metric: 'SALES_UNITS',
      period: 'DAILY',
      avg_sales_days: 7,
      show_incentive: false,
      unit: '',
      color: '#E86F2C',
    },
  ]
}

function buildTargetPath(featureId: string, fieldKey: string): string {
  // _brand → brand.{key}
  if (featureId.startsWith('_')) {
    return `${featureId.slice(1)}.${fieldKey}`
  }
  return `features.${featureId}.config.${fieldKey}`
}

const INPUT_TYPE_OPTIONS: { value: ConfigEditorField['input_type']; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'toggle', label: 'Toggle' },
  { value: 'color_picker', label: 'Color Picker' },
  { value: 'image_upload', label: 'Image Upload' },
  { value: 'select', label: 'Select' },
  { value: 'list_selection', label: 'List Selection' },
  { value: 'list_editor', label: 'List Editor' },
]

let _nodeCounter = 0

// ── Component ──

export function CreateViewMeta({
  globalConfigs,
  onComplete,
  initialViewId = '',
  initialAppType = '',
}: CreateViewMetaProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1
  const [viewId, setViewId] = useState(initialViewId)
  const [appType, setAppType] = useState(initialAppType)

  // Step 2
  const [featureStates, setFeatureStates] = useState<Record<string, FeatureSelectionState>>(() =>
    initFeatureStates(globalConfigs),
  )
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({})

  // Step 3
  const [configNodes, setConfigNodes] = useState<ConfigNodeState[]>([])
  const [expandedNodeIdx, setExpandedNodeIdx] = useState<number | null>(null)
  const [fieldPicker, setFieldPicker] = useState<FieldPickerState | null>(null)
  const [jsonFieldInput, setJsonFieldInput] = useState<{ nodeIndex: number; json: string; error: string } | null>(null)

  // Step 1
  const canNext = viewId.trim() !== '' && appType.trim() !== ''

  // Step 2
  const selectedCount = Object.values(featureStates).filter((s) => s.selected).length
  const hasJsonErrors = Object.keys(jsonErrors).some(
    (fid) => jsonErrors[fid] && featureStates[fid]?.selected,
  )
  const canGoStep3 = selectedCount > 0 && !hasJsonErrors

  const handleToggleFeature = (featureId: string) => {
    setFeatureStates((prev) => ({
      ...prev,
      [featureId]: { ...prev[featureId], selected: !prev[featureId].selected },
    }))
  }

  const handleEditField = (
    featureId: string,
    field: 'featureLabel' | 'featureDescription' | 'featureDefaultJson',
    value: string,
  ) => {
    setFeatureStates((prev) => ({
      ...prev,
      [featureId]: { ...prev[featureId], [field]: value },
    }))
    if (field === 'featureDefaultJson') {
      try {
        JSON.parse(value)
        setJsonErrors((prev) => {
          const next = { ...prev }
          delete next[featureId]
          return next
        })
      } catch (e) {
        setJsonErrors((prev) => ({ ...prev, [featureId]: (e as Error).message }))
      }
    }
  }

  const handleGoToStep2 = () => {
    if (Object.keys(featureStates).length === 0 && globalConfigs.length > 0) {
      setFeatureStates(initFeatureStates(globalConfigs))
    }
    setStep(2)
  }

  // ── Step 3 handlers ──

  const handleAddNode = () => {
    _nodeCounter++
    setConfigNodes((prev) => [
      ...prev,
      {
        nodeId: `config_node_${_nodeCounter}`,
        nodeLabel: '',
        nodeDescription: '',
        fields: [],
      },
    ])
    setExpandedNodeIdx(configNodes.length)
  }

  const handleRemoveNode = (idx: number) => {
    setConfigNodes((prev) => prev.filter((_, i) => i !== idx))
    if (expandedNodeIdx === idx) setExpandedNodeIdx(null)
    else if (expandedNodeIdx !== null && expandedNodeIdx > idx) setExpandedNodeIdx(expandedNodeIdx - 1)
  }

  const handleNodeField = (nodeIdx: number, field: 'nodeId' | 'nodeLabel' | 'nodeDescription', value: string) => {
    setConfigNodes((prev) => prev.map((n, i) => i === nodeIdx ? { ...n, [field]: value } : n))
  }

  const handleAddFieldFromPicker = () => {
    if (!fieldPicker) return
    const { nodeIndex, featureId, fieldKey } = fieldPicker
    if (!featureId || !fieldKey) return

    const gc = globalConfigs.find((g) => g.feature_id === featureId)
    const gcField = gc?.fields.find((f) => f.key === fieldKey)
    if (!gcField) return

    const inputType = guessInputType(featureId, fieldKey, gcField.type)

    const newField: ConfigEditorField = {
      field_id: `${featureId}_${fieldKey}`,
      target_path: buildTargetPath(featureId, fieldKey),
      label: gcField.label,
      description: gcField.description,
      input_type: inputType,
    }

    // For list_editor: auto-populate item_fields and display keys from global config
    if (inputType === 'list_editor' && gcField.item_fields && gcField.item_fields.length > 0) {
      newField.identity_key = inferIdentityKey(gcField.item_fields)
      newField.label_key = inferDisplayKey(gcField.item_fields, 'label')
      newField.subtitle_key = inferDisplayKey(gcField.item_fields, 'subtitle')
      newField.toggle_key = inferToggleKey(gcField.item_fields)
      newField.item_fields = buildItemFields(featureId, fieldKey, gcField.item_fields)
      // Default tasks for the "tasks" field
      if (fieldKey === 'tasks') {
        newField.default_value = buildDefaultTasks()
      }
    }

    setConfigNodes((prev) =>
      prev.map((n, i) => i === nodeIndex ? { ...n, fields: [...n.fields, newField] } : n),
    )
    setFieldPicker(null)
  }

  const handleAddFieldFromJson = () => {
    if (!jsonFieldInput) return
    try {
      const parsed = JSON.parse(jsonFieldInput.json) as ConfigEditorField
      if (!parsed.field_id || !parsed.target_path || !parsed.input_type) {
        setJsonFieldInput({ ...jsonFieldInput, error: 'Must have field_id, target_path, and input_type' })
        return
      }
      setConfigNodes((prev) =>
        prev.map((n, i) =>
          i === jsonFieldInput.nodeIndex
            ? { ...n, fields: [...n.fields, parsed] }
            : n,
        ),
      )
      setJsonFieldInput(null)
    } catch (e) {
      setJsonFieldInput({ ...jsonFieldInput, error: (e as Error).message })
    }
  }

  const handleRemoveField = (nodeIdx: number, fieldIdx: number) => {
    setConfigNodes((prev) =>
      prev.map((n, i) =>
        i === nodeIdx ? { ...n, fields: n.fields.filter((_, fi) => fi !== fieldIdx) } : n,
      ),
    )
  }

  const handleFieldInputType = (nodeIdx: number, fieldIdx: number, inputType: ConfigEditorField['input_type']) => {
    setConfigNodes((prev) =>
      prev.map((n, i) =>
        i === nodeIdx
          ? { ...n, fields: n.fields.map((f, fi) => fi === fieldIdx ? { ...f, input_type: inputType } : f) }
          : n,
      ),
    )
  }

  // ── Generate ──

  const handleGenerate = () => {
    // Step 2 → feature_selection node
    const children = globalConfigs
      .filter((gc) => featureStates[gc.feature_id]?.selected)
      .map((gc) => {
        const state = featureStates[gc.feature_id]
        const child: Record<string, unknown> = {
          feature_id: gc.feature_id,
          feature_label: state.featureLabel,
          feature_description: state.featureDescription,
        }
        const trimmed = state.featureDefaultJson.trim()
        if (trimmed && trimmed !== '{}') {
          try {
            child.feature_default = JSON.parse(trimmed)
          } catch { /* skip */ }
        }
        return child
      })

    const nodes: Record<string, unknown>[] = [
      {
        node_id: 'feature_selection',
        node_label: 'Features',
        node_logo: '',
        node_description: 'Toggle and configure app features',
        node_type: 'feature_selection' as const,
        children,
      },
    ]

    // Step 3 → config_editor nodes
    for (const cn of configNodes) {
      if (cn.fields.length === 0) continue
      nodes.push({
        node_id: cn.nodeId || `config_${nodes.length}`,
        node_label: cn.nodeLabel || 'Untitled',
        node_logo: '',
        node_description: cn.nodeDescription || '',
        node_type: 'config_editor' as const,
        config: cn.fields,
      })
    }

    const viewMeta = {
      view_id: viewId.trim(),
      app_type: appType.trim(),
      nodes,
    }

    onComplete?.(viewMeta as any)
  }

  // Can generate: at least step 2 is valid (step 3 nodes are optional)
  const canGenerate = canGoStep3

  if (!globalConfigs || globalConfigs.length === 0) {
    return <div style={S.empty}>No global features available. Fetch the Global Schema first.</div>
  }

  return (
    <div style={S.container}>
      {/* Step indicator */}
      <div style={S.stepIndicator}>
        <div style={S.stepDot(step === 1, step > 1)}>1</div>
        <div style={S.stepLine} />
        <div style={S.stepDot(step === 2, step > 2)}>2</div>
        <div style={S.stepLine} />
        <div style={S.stepDot(step === 3, false)}>3</div>
      </div>

      {/* ── Step 1: View Info ── */}
      {step === 1 && (
        <>
          <div style={S.heading}>View Information</div>
          <div style={S.subheading}>Basic metadata for the view</div>

          <div style={S.fieldGroup}>
            <div>
              <div style={S.label}>View ID</div>
              <input
                style={S.input}
                value={viewId}
                onChange={(e) => setViewId(e.target.value)}
                placeholder="e.g. sfa_main_config"
              />
            </div>
            <div>
              <div style={S.label}>App Type</div>
              <input
                style={S.input}
                value={appType}
                onChange={(e) => setAppType(e.target.value)}
                placeholder="e.g. sfa"
              />
            </div>
          </div>

          <div style={S.btnRow}>
            <button style={S.btnPrimary(!canNext)} disabled={!canNext} onClick={handleGoToStep2}>
              Next
            </button>
          </div>
        </>
      )}

      {/* ── Step 2: Feature Selection ── */}
      {step === 2 && (
        <>
          <div style={S.heading}>Feature Selection</div>
          <div style={S.subheading}>
            Select features to include and customize their view-level labels.
            {selectedCount > 0 && ` (${selectedCount} selected)`}
          </div>

          <div style={S.grid}>
            {globalConfigs.map((gc) => {
              const state = featureStates[gc.feature_id]
              if (!state) return null
              return (
                <div key={gc.feature_id} style={S.card(state.selected)}>
                  <div style={S.cardHeader} onClick={() => handleToggleFeature(gc.feature_id)}>
                    <div style={S.checkbox(state.selected)}>
                      {state.selected && <CheckIcon />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={S.featureId}>{gc.feature_id}</div>
                      <div style={S.featureName}>{gc.display_name}</div>
                      <div style={S.featureDesc}>{gc.description}</div>
                      <div style={S.stats}>
                        {gc.fields?.length ?? 0} fields &middot;{' '}
                        {gc.services?.length ?? 0} services &middot;{' '}
                        {gc.strategies?.length ?? 0} strategies
                      </div>
                    </div>
                  </div>

                  {state.selected && (
                    <div style={S.editSection}>
                      <div>
                        <div style={S.editLabel}>Feature Label (view-level)</div>
                        <input
                          style={S.editInput}
                          value={state.featureLabel}
                          onChange={(e) => handleEditField(gc.feature_id, 'featureLabel', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <div style={S.editLabel}>Feature Description (view-level)</div>
                        <input
                          style={S.editInput}
                          value={state.featureDescription}
                          onChange={(e) => handleEditField(gc.feature_id, 'featureDescription', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <div style={S.editLabel}>Feature Default (JSON)</div>
                        <textarea
                          style={S.editTextarea}
                          value={state.featureDefaultJson}
                          onChange={(e) => handleEditField(gc.feature_id, 'featureDefaultJson', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {jsonErrors[gc.feature_id] && (
                          <div style={S.jsonError}>{jsonErrors[gc.feature_id]}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={S.btnRow}>
            <button style={S.btnSecondary} onClick={() => setStep(1)}>Back</button>
            <button style={S.btnPrimary(!canGoStep3)} disabled={!canGoStep3} onClick={() => setStep(3)}>
              Next
            </button>
          </div>
        </>
      )}

      {/* ── Step 3: Config Editor Nodes ── */}
      {step === 3 && (
        <>
          <div style={S.heading}>Config Editor Nodes</div>
          <div style={S.subheading}>
            Create nodes to edit specific tenant config values — brand colors, KPI lists, etc.
            {configNodes.length > 0 && ` (${configNodes.length} node${configNodes.length > 1 ? 's' : ''})`}
          </div>

          {/* Add Node button */}
          <button style={S.addNodeBtn} onClick={handleAddNode}>
            + Add Config Node
          </button>

          {/* Node list */}
          {configNodes.map((node, nodeIdx) => {
            const isExpanded = expandedNodeIdx === nodeIdx
            return (
              <div key={nodeIdx} style={S.nodeCard}>
                {/* Node header */}
                <div style={S.nodeHeader} onClick={() => setExpandedNodeIdx(isExpanded ? null : nodeIdx)}>
                  <div style={S.nodeTitle}>{node.nodeLabel || 'Untitled Node'}</div>
                  <span style={S.nodeBadge}>{node.fields.length} field{node.fields.length !== 1 ? 's' : ''}</span>
                  <button
                    style={S.removeBtn}
                    onClick={(e) => { e.stopPropagation(); handleRemoveNode(nodeIdx) }}
                    title="Remove node"
                  >
                    &times;
                  </button>
                  <span style={{ fontSize: 12, color: '#9ca3af', transition: 'transform 0.15s', transform: isExpanded ? 'rotate(180deg)' : '' }}>▼</span>
                </div>

                {/* Node body */}
                {isExpanded && (
                  <div style={S.nodeBody}>
                    {/* Node metadata */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={S.editLabel}>Node ID</div>
                        <input style={S.editInput} value={node.nodeId} onChange={(e) => handleNodeField(nodeIdx, 'nodeId', e.target.value)} />
                      </div>
                      <div style={{ flex: 2 }}>
                        <div style={S.editLabel}>Label</div>
                        <input style={S.editInput} value={node.nodeLabel} onChange={(e) => handleNodeField(nodeIdx, 'nodeLabel', e.target.value)} placeholder="e.g. Brand & Theming" />
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={S.editLabel}>Description</div>
                      <input style={S.editInput} value={node.nodeDescription} onChange={(e) => handleNodeField(nodeIdx, 'nodeDescription', e.target.value)} placeholder="e.g. Visual branding overrides" />
                    </div>

                    {/* Fields list */}
                    {node.fields.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ ...S.editLabel, marginBottom: 6 }}>Fields</div>
                        {node.fields.map((f, fIdx) => (
                          <div key={fIdx} style={S.fieldRow}>
                            <span style={S.fieldId}>{f.field_id}</span>
                            <select
                              style={{ ...S.select, fontSize: 10, padding: '2px 6px', minWidth: 90 }}
                              value={f.input_type}
                              onChange={(e) => handleFieldInputType(nodeIdx, fIdx, e.target.value as ConfigEditorField['input_type'])}
                            >
                              {INPUT_TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            <span style={S.fieldPath} title={f.target_path}>{f.target_path}</span>
                            <button style={S.fieldRemove} onClick={() => handleRemoveField(nodeIdx, fIdx)} title="Remove">&times;</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Field from Global Config */}
                    {fieldPicker?.nodeIndex === nodeIdx ? (
                      <div style={{ background: '#f9fafb', borderRadius: 8, padding: 10, border: '1px solid #e5e7eb', marginBottom: 8 }}>
                        <div style={{ ...S.editLabel, marginBottom: 6 }}>Pick from Global Config</div>
                        <div style={S.pickerRow}>
                          <div>
                            <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>Feature</div>
                            <select
                              style={S.select}
                              value={fieldPicker.featureId}
                              onChange={(e) => setFieldPicker({ ...fieldPicker, featureId: e.target.value, fieldKey: '' })}
                            >
                              <option value="">Select feature...</option>
                              {globalConfigs.map((gc) => (
                                <option key={gc.feature_id} value={gc.feature_id}>{gc.feature_id} — {gc.display_name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>Field</div>
                            <select
                              style={S.select}
                              value={fieldPicker.fieldKey}
                              onChange={(e) => setFieldPicker({ ...fieldPicker, fieldKey: e.target.value })}
                              disabled={!fieldPicker.featureId}
                            >
                              <option value="">Select field...</option>
                              {fieldPicker.featureId && globalConfigs
                                .find((g) => g.feature_id === fieldPicker.featureId)
                                ?.fields.map((f) => (
                                  <option key={f.key} value={f.key}>{f.key} ({f.type})</option>
                                ))}
                            </select>
                          </div>
                          <button
                            style={S.btnPrimary(!fieldPicker.featureId || !fieldPicker.fieldKey)}
                            disabled={!fieldPicker.featureId || !fieldPicker.fieldKey}
                            onClick={handleAddFieldFromPicker}
                          >
                            Add
                          </button>
                          <button style={S.btnSecondary} onClick={() => setFieldPicker(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        style={S.addBtn}
                        onClick={() => setFieldPicker({ nodeIndex: nodeIdx, featureId: '', fieldKey: '' })}
                      >
                        + Add Field from Global Config
                      </button>
                    )}

                    {/* Or divider */}
                    <div style={S.orDivider}>
                      <div style={S.dividerLine} />
                      <span>or</span>
                      <div style={S.dividerLine} />
                    </div>

                    {/* Add Field from JSON */}
                    {jsonFieldInput?.nodeIndex === nodeIdx ? (
                      <div style={{ background: '#f9fafb', borderRadius: 8, padding: 10, border: '1px solid #e5e7eb' }}>
                        <div style={{ ...S.editLabel, marginBottom: 4 }}>Paste field JSON (for list_selection, etc.)</div>
                        <textarea
                          style={S.jsonFieldArea}
                          value={jsonFieldInput.json}
                          onChange={(e) => setJsonFieldInput({ ...jsonFieldInput, json: e.target.value, error: '' })}
                          placeholder={'{\n  "field_id": "kpi_list",\n  "target_path": "features.kpi.config.kpi_config_list",\n  "label": "KPIs",\n  "input_type": "list_selection",\n  "identity_key": "id",\n  "list_options": [...]\n}'}
                        />
                        {jsonFieldInput.error && <div style={S.jsonError}>{jsonFieldInput.error}</div>}
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button style={S.btnPrimary(false)} onClick={handleAddFieldFromJson}>Add Field</button>
                          <button style={S.btnSecondary} onClick={() => setJsonFieldInput(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        style={S.addBtn}
                        onClick={() => setJsonFieldInput({ nodeIndex: nodeIdx, json: '', error: '' })}
                      >
                        + Add Field (JSON)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          <div style={S.btnRow}>
            <button style={S.btnSecondary} onClick={() => setStep(2)}>Back</button>
            <button style={S.btnPrimary(!canGenerate)} disabled={!canGenerate} onClick={handleGenerate}>
              Generate ViewMeta
            </button>
          </div>
        </>
      )}
    </div>
  )
}

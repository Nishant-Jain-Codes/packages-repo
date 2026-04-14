import { createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode } from 'react'
import type { ViewMeta, TenantConfig, TenantFeatureConfig, GlobalFeatureConfig, NodeMeta, EndpointsConfig, StoreActivityChild, FeatureChild } from '../types'
import type { NodeTab } from '../components/TopToggleList'
import type { FeatureCardItem } from '../components/MiddleContent'
import type { ActivityCardItem } from '../derivations/deriveActivityCards'
import type { Action } from '../components/BottomActionBar'
import { deriveNodeTabs } from '../derivations/deriveNodeTabs'
import { deriveFeatureCards } from '../derivations/deriveFeatureCards'
import { deriveActivityCards } from '../derivations/deriveActivityCards'
import { toggleFeature } from '../toggles/featureToggle'
import { setByPath } from '../utils/pathUtils'

export interface ViewRendererContextValue {
  // Immutable references (read-only, passed from host)
  tenantConfig: TenantConfig | null
  globalConfigs: GlobalFeatureConfig[]
  viewMeta: ViewMeta | null
  currentNodeMeta: NodeMeta | null

  // Mutable draft (working copy being edited)
  draft: TenantConfig | null

  // Derived state
  nodeTabs: NodeTab[]
  activeNodeId: string
  featureCards: FeatureCardItem[]
  activityCards: ActivityCardItem[]
  actions: Action[]
  isDirty: boolean
  isSaving: boolean

  // Action handlers
  handleSelectNode: (nodeId: string) => void
  handleToggleFeature: (featureId: string, enabled: boolean) => void
  handleToggleActivity: (activityId: string, enabled: boolean) => void
  handleAdvancedSettings: (activityId: string) => void
  handleUpdateDraft: (path: string, value: unknown) => void
  handleSave: () => Promise<void>
  handleDiscard: () => void

  // Setters (escape hatches for advanced use)
  setTenantConfig: (config: TenantConfig | null) => void
  setGlobalConfigs: (configs: GlobalFeatureConfig[]) => void
  setCurrentNodeMeta: (node: NodeMeta | null) => void
  setDraft: (draft: TenantConfig | null) => void
}

const ViewRendererContext = createContext<ViewRendererContextValue | null>(null)

export interface ViewRendererProviderProps {
  children: ReactNode
  initialTenantConfig?: TenantConfig | null
  initialGlobalConfigs?: GlobalFeatureConfig[]
  initialViewMeta?: ViewMeta | null
  onSave?: (draft: TenantConfig) => Promise<void>
  endpoints?: EndpointsConfig
  onBeforeSave?: (draft: TenantConfig) => Record<string, unknown>
  onSaveSuccess?: (nodeType: string) => void
  onSaveError?: (nodeType: string, error: Error) => void
  onAdvancedSettings?: (activityId: string, currentConfig: Record<string, unknown> | null) => void
  onDraftChange?: (draft: TenantConfig | null) => void
}

export function ViewRendererProvider({
  children,
  initialTenantConfig = null,
  initialGlobalConfigs = [],
  initialViewMeta = null,
  onSave,
  endpoints,
  onBeforeSave,
  onSaveSuccess,
  onSaveError,
  onAdvancedSettings,
  onDraftChange,
}: ViewRendererProviderProps) {
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(initialTenantConfig)
  const [globalConfigs, setGlobalConfigs] = useState<GlobalFeatureConfig[]>(initialGlobalConfigs)
  const [viewMeta, setViewMeta] = useState<ViewMeta | null>(initialViewMeta)
  const [currentNodeMeta, setCurrentNodeMeta] = useState<NodeMeta | null>(null)
  const [draft, setDraft] = useState<TenantConfig | null>(
    initialTenantConfig ? structuredClone(initialTenantConfig) : null,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [activeNodeId, setActiveNodeId] = useState<string>(
    () => initialViewMeta?.nodes[0]?.node_id ?? '',
  )

  // Sync when host passes new initial props (e.g. after re-fetch)
  useEffect(() => {
    if (initialTenantConfig) {
      setTenantConfig(initialTenantConfig)
      setDraft(structuredClone(initialTenantConfig))
    }
  }, [initialTenantConfig])

  useEffect(() => {
    setGlobalConfigs(initialGlobalConfigs)
  }, [initialGlobalConfigs])

  useEffect(() => {
    if (initialViewMeta) {
      setViewMeta(initialViewMeta)
      const firstNodeId = initialViewMeta.nodes?.[0]?.node_id ?? ''
      setActiveNodeId((prev) => prev || firstNodeId)
    }
  }, [initialViewMeta])

  // Derived state
  const nodeTabs = useMemo(
    () => (viewMeta ? deriveNodeTabs(viewMeta) : []),
    [viewMeta],
  )

  const activeNodeMeta = useMemo(
    () => viewMeta?.nodes.find((n) => n.node_id === activeNodeId) ?? null,
    [viewMeta, activeNodeId],
  )

  const featureCards = useMemo(
    () => (viewMeta && draft && activeNodeId ? deriveFeatureCards(viewMeta, draft, activeNodeId) : []),
    [viewMeta, draft, activeNodeId],
  )

  const activityCards = useMemo(
    () => (viewMeta && draft && activeNodeId ? deriveActivityCards(viewMeta, draft, activeNodeId) : []),
    [viewMeta, draft, activeNodeId],
  )

  const isDirty = useMemo(
    () => JSON.stringify(tenantConfig) !== JSON.stringify(draft),
    [tenantConfig, draft],
  )

  const actions = useMemo<Action[]>(() => [
    { id: 'save', label: 'Save', variant: 'primary', disabled: !isDirty || isSaving },
    { id: 'discard', label: 'Discard', variant: 'secondary', disabled: !isDirty },
  ], [isDirty, isSaving])

  // Notify host of draft changes
  useEffect(() => {
    onDraftChange?.(draft)
  }, [draft, onDraftChange])

  // Action handlers
  const handleSelectNode = useCallback((nodeId: string) => {
    setActiveNodeId(nodeId)
  }, [])

  const handleToggleFeature = useCallback((featureId: string, enabled: boolean) => {
    if (!viewMeta || !draft || !tenantConfig || !globalConfigs.length) return

    for (const node of viewMeta.nodes) {
      if (node.node_type === 'feature_selection') {
        const child = node.children.find((c) => c.feature_id === featureId)
        if (child) {
          const { updatedFeatures } = toggleFeature(
            child,
            enabled,
            draft.features,
            globalConfigs,
            tenantConfig.features,
          )
          setDraft({ ...draft, features: updatedFeatures })
          break
        }
      }
    }
  }, [viewMeta, draft, tenantConfig, globalConfigs])

  const handleToggleActivity = useCallback((activityId: string, enabled: boolean) => {
    console.log('[ViewRenderer] toggleActivity', { activityId, enabled })
    if (!viewMeta || !draft || !tenantConfig) return

    for (const node of viewMeta.nodes) {
      if (node.node_type === 'store_activity') {
        const child = node.children.find((c: StoreActivityChild) => c.activity_id === activityId)
        if (child) {
          const updatedFeatures = { ...draft.features }

          if (!enabled) {
            // Toggle OFF — remove the feature
            delete updatedFeatures[activityId]
          } else {
            // Toggle ON — restore from original tenant config, or use activity_default
            const original = tenantConfig.features[activityId]
            if (original) {
              updatedFeatures[activityId] = { ...structuredClone(original), enabled: true }
            } else if (child.activity_default) {
              updatedFeatures[activityId] = structuredClone(child.activity_default) as unknown as TenantFeatureConfig
              updatedFeatures[activityId].enabled = true
            } else {
              updatedFeatures[activityId] = { enabled: true, strategies: {}, config: {}, services: {} }
            }
          }

          // Sync outletActivityTabs array
          const outletActivity = updatedFeatures.outlet_activity ?? draft.features.outlet_activity
          if (outletActivity) {
            const config = outletActivity.config as Record<string, unknown>
            const currentTabs = Array.isArray(config.outletActivityTabs)
              ? [...(config.outletActivityTabs as Record<string, unknown>[])]
              : []

            if (enabled && child.tab_default) {
              if (!currentTabs.some((t) => t.id === child.activity_id)) {
                currentTabs.push({ ...child.tab_default })
              }
            } else {
              const idx = currentTabs.findIndex((t) => t.id === child.activity_id)
              if (idx !== -1) currentTabs.splice(idx, 1)
            }

            updatedFeatures.outlet_activity = {
              ...outletActivity,
              config: { ...config, outletActivityTabs: currentTabs },
            }
          }

          setDraft({ ...draft, features: updatedFeatures })
          break
        }
      }
    }
  }, [viewMeta, draft, tenantConfig])

  const handleAdvancedSettings = useCallback((activityId: string) => {
    if (!draft) return
    const currentConfig = draft.features[activityId]?.config ?? null
    console.log('[ViewRenderer] advancedSettings fired', { activityId, hasCallback: !!onAdvancedSettings, currentConfig })
    onAdvancedSettings?.(activityId, currentConfig as Record<string, unknown> | null)
  }, [draft, onAdvancedSettings])

  const handleUpdateDraft = useCallback((path: string, value: unknown) => {
    setDraft((prev) => {
      if (!prev) return prev
      return setByPath(prev as unknown as Record<string, unknown>, path, value) as unknown as TenantConfig
    })
  }, [])

  const handleSave = useCallback(async () => {
    if (!draft) return
    setIsSaving(true)
    try {
      if (onSave) {
        // Consumer owns the save logic
        await onSave(draft)
        setTenantConfig(structuredClone(draft))
      } else if (endpoints?.tenantConfig) {
        // Legacy: internal fetch (backward compat)
        const nodeType = activeNodeMeta?.node_type ?? 'unknown'
        const payload = onBeforeSave ? onBeforeSave(draft) : { config: draft }
        const res = await fetch(endpoints.tenantConfig, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        setTenantConfig(structuredClone(draft))
        onSaveSuccess?.(nodeType)
      }
    } catch (err) {
      if (!onSave) {
        const nodeType = activeNodeMeta?.node_type ?? 'unknown'
        onSaveError?.(nodeType, err instanceof Error ? err : new Error(String(err)))
      } else {
        throw err
      }
    } finally {
      setIsSaving(false)
    }
  }, [draft, onSave, endpoints, activeNodeMeta, onBeforeSave, onSaveSuccess, onSaveError])

  const handleDiscard = useCallback(() => {
    if (tenantConfig) {
      setDraft(structuredClone(tenantConfig))
    }
  }, [tenantConfig])

  const value: ViewRendererContextValue = {
    tenantConfig,
    globalConfigs,
    viewMeta,
    currentNodeMeta: activeNodeMeta ?? currentNodeMeta,
    draft,
    nodeTabs,
    activeNodeId,
    featureCards,
    activityCards,
    actions,
    isDirty,
    isSaving,
    handleSelectNode,
    handleToggleFeature,
    handleToggleActivity,
    handleAdvancedSettings,
    handleUpdateDraft,
    handleSave,
    handleDiscard,
    setTenantConfig,
    setGlobalConfigs,
    setCurrentNodeMeta,
    setDraft,
  }

  return (
    <ViewRendererContext.Provider value={value}>
      {children}
    </ViewRendererContext.Provider>
  )
}

export function useViewRenderer(): ViewRendererContextValue {
  const ctx = useContext(ViewRendererContext)
  if (!ctx) throw new Error('useViewRenderer must be used within ViewRendererProvider')
  return ctx
}

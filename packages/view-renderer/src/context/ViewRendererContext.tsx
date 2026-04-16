import { createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode } from 'react'
import type {
  ViewMeta,
  TenantConfig,
  TenantFeatureConfig,
  GlobalFeatureConfig,
  NodeMeta,
  StoreActivityChild,
  AppTypeKey,
  TenantConfigMap,
  GlobalConfigMap,
  DraftMap,
  EndpointsConfigMap,
} from '../types'
import type { NodeTab } from '../components/TopToggleList'
import type { FeatureCardItem } from '../components/MiddleContent'
import type { ActivityCardItem } from '../derivations/deriveActivityCards'
import type { Action } from '../components/BottomActionBar'
import { deriveNodeTabs } from '../derivations/deriveNodeTabs'
import { deriveFeatureCards } from '../derivations/deriveFeatureCards'
import { deriveActivityCards } from '../derivations/deriveActivityCards'
import { toggleFeature } from '../toggles/featureToggle'
import { setByPath } from '../utils/pathUtils'
import { resolveTargetKeys } from '../utils/resolveTargetKeys'

export interface ViewRendererContextValue {
  // Immutable references (read-only, passed from host)
  tenantConfigMap: TenantConfigMap | null
  globalConfigMap: GlobalConfigMap | null
  viewMeta: ViewMeta | null
  currentNodeMeta: NodeMeta | null

  // PWA preview config (passed from host)
  pwaUrl: string | null
  pwaToken: string | null

  // Mutable drafts (working copies being edited)
  draftMap: DraftMap | null

  // Derived state
  nodeTabs: NodeTab[]
  activeNodeId: string
  featureCards: FeatureCardItem[]
  activityCards: ActivityCardItem[]
  actions: Action[]
  isDirty: boolean
  dirtyKeys: AppTypeKey[]
  isSaving: boolean

  // Action handlers
  handleSelectNode: (nodeId: string) => void
  handleToggleFeature: (featureId: string, enabled: boolean) => void
  handleToggleActivity: (activityId: string, enabled: boolean) => void
  handleAdvancedSettings: (activityId: string) => void
  advancedSettingsTarget: string | null
  closeAdvancedSettings: () => void
  handleUpdateDraft: (path: string, value: unknown, targetKeys?: AppTypeKey[]) => void
  handleSave: () => Promise<void>
  handleDiscard: () => void

  // Setters (escape hatches for advanced use)
  setTenantConfigMap: (map: TenantConfigMap | null) => void
  setGlobalConfigMap: (map: GlobalConfigMap | null) => void
  setCurrentNodeMeta: (node: NodeMeta | null) => void
  setDraftMap: (map: DraftMap | null | ((prev: DraftMap | null) => DraftMap | null)) => void
}

const ViewRendererContext = createContext<ViewRendererContextValue | null>(null)

export interface ViewRendererProviderProps {
  children: ReactNode
  initialTenantConfigMap?: TenantConfigMap | null
  initialGlobalConfigMap?: GlobalConfigMap | null
  initialViewMeta?: ViewMeta | null
  onSave?: (configKey: AppTypeKey, draft: TenantConfig) => Promise<void>
  endpoints?: EndpointsConfigMap
  onBeforeSave?: (configKey: AppTypeKey, draft: TenantConfig) => Record<string, unknown>
  onSaveSuccess?: (nodeType: string, configKey: AppTypeKey) => void
  onSaveError?: (nodeType: string, configKey: AppTypeKey, error: Error) => void
  onAdvancedSettings?: (activityId: string, currentConfig: Record<string, unknown> | null) => void
  onDraftChange?: (draftMap: DraftMap | null) => void
  pwaUrl?: string
  pwaToken?: string
}

function cloneConfigMap(map: TenantConfigMap | null | undefined): DraftMap | null {
  if (!map) return null
  const cloned: DraftMap = {}
  for (const key of Object.keys(map)) {
    cloned[key] = structuredClone(map[key])
  }
  return cloned
}

export function ViewRendererProvider({
  children,
  initialTenantConfigMap = null,
  initialGlobalConfigMap = null,
  initialViewMeta = null,
  onSave,
  endpoints,
  onBeforeSave,
  onSaveSuccess,
  onSaveError,
  onAdvancedSettings,
  onDraftChange,
  pwaUrl,
  pwaToken,
}: ViewRendererProviderProps) {
  const [tenantConfigMap, setTenantConfigMap] = useState<TenantConfigMap | null>(initialTenantConfigMap)
  const [globalConfigMap, setGlobalConfigMap] = useState<GlobalConfigMap | null>(initialGlobalConfigMap)
  const [viewMeta, setViewMeta] = useState<ViewMeta | null>(initialViewMeta)
  const [currentNodeMeta, setCurrentNodeMeta] = useState<NodeMeta | null>(null)
  const [draftMap, setDraftMap] = useState<DraftMap | null>(
    () => cloneConfigMap(initialTenantConfigMap),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [advancedSettingsTarget, setAdvancedSettingsTarget] = useState<string | null>(null)
  const [activeNodeId, setActiveNodeId] = useState<string>(
    () => initialViewMeta?.nodes[0]?.node_id ?? '',
  )

  // All config keys present in the draft map
  const allConfigKeys = useMemo(
    () => (draftMap ? Object.keys(draftMap) : []),
    [draftMap],
  )

  // Sync when host passes new initial props (e.g. after re-fetch)
  useEffect(() => {
    if (initialTenantConfigMap) {
      setTenantConfigMap(initialTenantConfigMap)
      setDraftMap(cloneConfigMap(initialTenantConfigMap))
    }
  }, [initialTenantConfigMap])

  useEffect(() => {
    setGlobalConfigMap(initialGlobalConfigMap)
  }, [initialGlobalConfigMap])

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
    () => (viewMeta && draftMap && activeNodeId ? deriveFeatureCards(viewMeta, draftMap, activeNodeId) : []),
    [viewMeta, draftMap, activeNodeId],
  )

  const activityCards = useMemo(
    () => (viewMeta && draftMap && activeNodeId ? deriveActivityCards(viewMeta, draftMap, activeNodeId) : []),
    [viewMeta, draftMap, activeNodeId],
  )

  const dirtyKeys = useMemo(() => {
    if (!tenantConfigMap || !draftMap) return []
    return Object.keys(draftMap).filter(
      (key) => JSON.stringify(tenantConfigMap[key]) !== JSON.stringify(draftMap[key]),
    )
  }, [tenantConfigMap, draftMap])

  const isDirty = dirtyKeys.length > 0

  const actions = useMemo<Action[]>(() => [
    { id: 'save', label: 'Save', variant: 'primary', disabled: !isDirty || isSaving },
    { id: 'discard', label: 'Discard', variant: 'secondary', disabled: !isDirty },
  ], [isDirty, isSaving])

  // Notify host of draft changes
  useEffect(() => {
    onDraftChange?.(draftMap)
  }, [draftMap, onDraftChange])

  // Action handlers
  const handleSelectNode = useCallback((nodeId: string) => {
    setActiveNodeId(nodeId)
  }, [])

  const handleToggleFeature = useCallback((featureId: string, enabled: boolean) => {
    if (!viewMeta || !draftMap || !tenantConfigMap || !globalConfigMap) return

    for (const node of viewMeta.nodes) {
      if (node.node_type === 'feature_selection') {
        const child = node.children.find((c) => c.feature_id === featureId)
        if (child) {
          const targetKeys = resolveTargetKeys(child.target_config_keys, node.target_config_keys, allConfigKeys)
          const newDraftMap = { ...draftMap }

          for (const key of targetKeys) {
            const draft = newDraftMap[key]
            const original = tenantConfigMap[key]
            const globals = globalConfigMap[key] ?? []
            if (!draft || !original) continue

            const { updatedFeatures } = toggleFeature(
              child,
              enabled,
              draft.features,
              globals,
              original.features,
            )
            newDraftMap[key] = { ...draft, features: updatedFeatures }
          }

          setDraftMap(newDraftMap)
          break
        }
      }
    }
  }, [viewMeta, draftMap, tenantConfigMap, globalConfigMap, allConfigKeys])

  const handleToggleActivity = useCallback((activityId: string, enabled: boolean) => {
    console.log('[ViewRenderer] toggleActivity', { activityId, enabled })
    if (!viewMeta || !draftMap || !tenantConfigMap) return

    for (const node of viewMeta.nodes) {
      if (node.node_type === 'store_activity') {
        const child = node.children.find((c: StoreActivityChild) => c.activity_id === activityId)
        if (child) {
          const targetKeys = resolveTargetKeys(child.target_config_keys, node.target_config_keys, allConfigKeys)
          const newDraftMap = { ...draftMap }

          for (const key of targetKeys) {
            const draft = newDraftMap[key]
            const original = tenantConfigMap[key]
            if (!draft || !original) continue

            const updatedFeatures = { ...draft.features }

            if (!enabled) {
              delete updatedFeatures[activityId]
            } else {
              const originalFeature = original.features[activityId]
              if (originalFeature) {
                updatedFeatures[activityId] = { ...structuredClone(originalFeature), enabled: true }
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

            newDraftMap[key] = { ...draft, features: updatedFeatures }
          }

          setDraftMap(newDraftMap)
          break
        }
      }
    }
  }, [viewMeta, draftMap, tenantConfigMap, allConfigKeys])

  const handleAdvancedSettings = useCallback((activityId: string) => {
    console.log('[ViewRenderer] advancedSettings pressed', { activityId, willOpenModal: true })
    setAdvancedSettingsTarget(activityId)
    if (onAdvancedSettings && draftMap) {
      const firstKey = allConfigKeys[0]
      const currentConfig = firstKey ? draftMap[firstKey]?.features[activityId]?.config ?? null : null
      onAdvancedSettings(activityId, currentConfig as Record<string, unknown> | null)
    }
  }, [draftMap, allConfigKeys, onAdvancedSettings])

  const closeAdvancedSettings = useCallback(() => {
    setAdvancedSettingsTarget(null)
  }, [])

  const handleUpdateDraft = useCallback((path: string, value: unknown, targetKeys?: AppTypeKey[]) => {
    setDraftMap((prev) => {
      if (!prev) return prev
      const keys = targetKeys ?? Object.keys(prev)
      const updated = { ...prev }
      for (const key of keys) {
        if (!updated[key]) continue
        updated[key] = setByPath(
          updated[key] as unknown as Record<string, unknown>,
          path,
          value,
        ) as unknown as TenantConfig
      }
      return updated
    })
  }, [])

  const handleSave = useCallback(async () => {
    if (!draftMap || dirtyKeys.length === 0) return
    setIsSaving(true)
    try {
      const nodeType = activeNodeMeta?.node_type ?? 'unknown'

      if (onSave) {
        // Consumer owns the save logic — call per dirty key
        const results = await Promise.allSettled(
          dirtyKeys.map((key) => onSave(key, draftMap[key])),
        )

        const newTenantConfigMap = { ...tenantConfigMap }
        for (let i = 0; i < dirtyKeys.length; i++) {
          const key = dirtyKeys[i]
          if (results[i].status === 'fulfilled') {
            newTenantConfigMap[key] = structuredClone(draftMap[key])
          }
        }
        setTenantConfigMap(newTenantConfigMap as TenantConfigMap)

        // Re-throw first rejection if any
        const firstRejection = results.find((r) => r.status === 'rejected')
        if (firstRejection && firstRejection.status === 'rejected') {
          throw firstRejection.reason
        }
      } else if (endpoints) {
        // Legacy: per-key endpoint POST
        for (const key of dirtyKeys) {
          const endpoint = endpoints[key]
          if (!endpoint) continue

          try {
            const payload = onBeforeSave ? onBeforeSave(key, draftMap[key]) : { config: draftMap[key] }
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)

            setTenantConfigMap((prev) => {
              if (!prev) return prev
              return { ...prev, [key]: structuredClone(draftMap[key]) }
            })
            onSaveSuccess?.(nodeType, key)
          } catch (err) {
            onSaveError?.(nodeType, key, err instanceof Error ? err : new Error(String(err)))
          }
        }
      }
    } catch (err) {
      if (onSave) throw err
    } finally {
      setIsSaving(false)
    }
  }, [draftMap, dirtyKeys, onSave, endpoints, activeNodeMeta, onBeforeSave, onSaveSuccess, onSaveError, tenantConfigMap])

  const handleDiscard = useCallback(() => {
    if (tenantConfigMap) {
      setDraftMap(cloneConfigMap(tenantConfigMap))
    }
  }, [tenantConfigMap])

  const value: ViewRendererContextValue = {
    tenantConfigMap,
    globalConfigMap,
    viewMeta,
    currentNodeMeta: activeNodeMeta ?? currentNodeMeta,
    pwaUrl: pwaUrl ?? null,
    pwaToken: pwaToken ?? null,
    draftMap,
    nodeTabs,
    activeNodeId,
    featureCards,
    activityCards,
    actions,
    isDirty,
    dirtyKeys,
    isSaving,
    handleSelectNode,
    handleToggleFeature,
    handleToggleActivity,
    handleAdvancedSettings,
    advancedSettingsTarget,
    closeAdvancedSettings,
    handleUpdateDraft,
    handleSave,
    handleDiscard,
    setTenantConfigMap,
    setGlobalConfigMap,
    setCurrentNodeMeta,
    setDraftMap,
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

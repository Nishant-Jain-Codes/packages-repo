// ── ViewMeta (simplified) ──

export interface ViewMeta {
  view_id: string
  app_type: string
  nodes: NodeMeta[]
}

// ── Base node shape ──

export interface NodeMetaBase {
  node_id: string
  node_label: string
  node_description: string
  node_type: string
  node_logo: string
}

// ── feature_selection node ──

export interface FeatureChild {
  feature_id: string
  feature_label: string
  feature_description: string
  feature_default?: Record<string, unknown>
}

export interface FeatureSelectionNodeMeta extends NodeMetaBase {
  node_type: 'feature_selection'
  children: FeatureChild[]
}

// ── config_editor node ──

export interface ConfigFieldValidation {
  required?: boolean
  max_size_mb?: number
  accepted_types?: string[]
  pattern?: string
  min?: number
  max?: number
}

export interface ListSelectionOption {
  id: string
  label: string
  description?: string
  default_config: Record<string, unknown>
}

export interface ConfigEditorField {
  field_id: string
  target_path: string
  label: string
  description?: string
  input_type: 'color_picker' | 'image_upload' | 'text' | 'toggle' | 'number' | 'select' | 'list_selection' | 'list_editor'
  validation?: ConfigFieldValidation
  options?: { label: string; value: string }[]
  default_value?: unknown
  readonly?: boolean
  // list_selection specific:
  identity_key?: string
  list_options?: ListSelectionOption[]
  // list_editor specific (array of objects with sub-field editing):
  item_fields?: ConfigEditorField[]
  label_key?: string
  subtitle_key?: string
  toggle_key?: string
}

export interface ConfigEditorNodeMeta extends NodeMetaBase {
  node_type: 'config_editor'
  config: ConfigEditorField[]
}

// ── store_activity node ──

export interface ActivityFieldTag {
  label: string
  type: 'camera' | 'text' | 'textarea' | 'dropdown' | 'number' | 'date' | 'checkbox' | 'multiselect' | 'radio' | 'location'
}

export interface StoreActivityChild {
  activity_id: string
  activity_label: string
  activity_description: string
  activity_default?: Record<string, unknown>
  tab_default?: Record<string, unknown>
  fields?: ActivityFieldTag[]
}

export interface StoreActivityNodeMeta extends NodeMetaBase {
  node_type: 'store_activity'
  children: StoreActivityChild[]
}

// Discriminated union — add new node types here
export type NodeMeta = FeatureSelectionNodeMeta | ConfigEditorNodeMeta | StoreActivityNodeMeta

// ── Global config (from /app/resolved_config) ──

export interface GlobalConfigField {
  key: string
  type: string
  label: string
  description: string
  default_value?: unknown
  group?: string
  item_fields?: GlobalConfigField[]
}

export interface GlobalFeatureConfig {
  feature_id: string
  display_name: string
  description: string
  fields: GlobalConfigField[]
  strategies: unknown[]
  services: unknown[]
}

// ── Endpoints config ──

export interface EndpointsConfig {
  tenantConfig: string
}

// ── Tenant config (from /tenant-config) ──

export interface TenantFeatureConfig {
  enabled: boolean
  strategies: Record<string, unknown>
  config: Record<string, unknown>
  services: Record<string, unknown>
}

export interface TenantConfig {
  tenant_id: string
  tenant_name: string
  brand: Record<string, unknown>
  features: Record<string, TenantFeatureConfig>
  strategies: Record<string, unknown>
  extra: Record<string, unknown>
}

// ── CreateViewMeta wizard ──

export interface CreateViewMetaProps {
  globalConfigs: GlobalFeatureConfig[]
  onComplete?: (viewMeta: ViewMeta) => void
  initialViewId?: string
  initialAppType?: string
}

export interface FeatureSelectionState {
  selected: boolean
  featureLabel: string
  featureDescription: string
  featureDefaultJson: string
}

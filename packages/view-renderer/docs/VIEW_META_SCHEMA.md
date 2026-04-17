# ViewMeta Schema Reference

## ViewMeta

The root object describing a view configuration.

```typescript
interface ViewMeta {
  view_id: string    // unique identifier for this view
  app_type: string   // target app type (e.g. "sfa", "mobile", "web")
  nodes: NodeMeta[]  // ordered list of configuration nodes
}
```

---

## NodeMeta (Discriminated Union)

Each node has a `node_type` field that determines its shape. To add a new node type:
1. Create a new interface extending `NodeMetaBase`
2. Set `node_type` to a string literal
3. Add it to the `NodeMeta` union in `src/types/index.ts`

### Base Shape

```typescript
interface NodeMetaBase {
  node_id: string          // unique identifier (e.g. "feature_selection")
  node_label: string       // display name (e.g. "Features")
  node_description: string // short description
  node_type: string        // discriminator
  node_logo: string        // SVG link (white color)
}
```

---

## Node Type: `feature_selection`

Renders a list of toggleable features. Each child maps to a feature in the tenant config.

```typescript
interface FeatureSelectionNodeMeta extends NodeMetaBase {
  node_type: 'feature_selection'
  children: FeatureChild[]
}

interface FeatureChild {
  feature_id: string                    // matches tenantConfig.features[feature_id] and globalConfig[].feature_id
  feature_label: string                 // display name
  feature_description: string           // short description
  feature_default?: Record<string, unknown>  // optional overrides when enabling from global defaults
}
```

### Feature Lookup

| Source | Lookup |
|--------|--------|
| Tenant config | `tenantConfig.features[feature_id]` |
| Global config | `globalConfigs.find(g => g.feature_id === feature_id)` |

### Toggle Behavior

**Toggle OFF:** Removes `tenantConfig.features[feature_id]` from the draft entirely.

**Toggle ON:**
1. If the feature existed and was enabled in the original tenant config (`originalFeatures[feature_id].enabled === true`), copy it back directly — preserving all customizations.
2. Otherwise, generate a fresh config from the global schema:
   - Create scaffold: `{ enabled: true, strategies: {}, config: {}, services: {} }`
   - Populate `config` from global field `default_value` entries
   - Apply `feature_default` overrides on top (if present on the FeatureChild)
   - Ensure `enabled = true`

---

## Example ViewMeta JSON

```json
{
  "view_id": "sfa_main_config",
  "app_type": "sfa",
  "nodes": [
    {
      "node_id": "feature_selection",
      "node_label": "Features",
      "node_logo": "https://example.com/icons/features.svg",
      "node_description": "Toggle and configure app features",
      "node_type": "feature_selection",
      "children": [
        {
          "feature_id": "attendance",
          "feature_label": "Attendance",
          "feature_description": "Employee attendance marking and dashboard",
          "feature_default": {
            "config": {
              "show_dashboard": true
            }
          }
        }
      ]
    }
  ]
}
```

---

## Context State Model

The `ViewRendererContext` holds:

| Field | Mutability | Description |
|-------|-----------|-------------|
| `tenantConfig` | Immutable | Original fetched tenant config (reference only) |
| `globalConfigs` | Immutable | Original fetched global feature configs (reference only) |
| `currentNodeMeta` | Immutable | Currently selected node (reference only) |
| `draft` | Mutable | Working copy of tenantConfig being edited |

---

## Types Location

All types are defined in `src/types/index.ts` and exported from `src/index.ts`.

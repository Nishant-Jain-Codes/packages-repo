import type {
  FeatureChild,
  GlobalFeatureConfig,
  TenantFeatureConfig,
} from '../types'
import { globalToTenantFeature } from '../transformers'

export interface ToggleFeatureResult {
  updatedFeatures: Record<string, TenantFeatureConfig>
  error?: string
}

/**
 * Toggle a feature ON or OFF in the tenant config draft.
 *
 * Toggle OFF: removes draftFeatures[feature_id]
 * Toggle ON:
 *   1. If feature existed and was enabled in original tenant config → copy it back (preserves customizations)
 *   2. Otherwise → generate from global config via transformer
 */
export function toggleFeature(
  featureChild: FeatureChild,
  enabled: boolean,
  draftFeatures: Record<string, TenantFeatureConfig>,
  globalConfigs: GlobalFeatureConfig[],
  originalTenantFeatures: Record<string, TenantFeatureConfig>,
): ToggleFeatureResult {
  const { feature_id } = featureChild
  const updatedFeatures = { ...draftFeatures }

  if (!enabled) {
    delete updatedFeatures[feature_id]
    return { updatedFeatures }
  }

  // Toggle ON — check if feature existed in original tenant config
  const original = originalTenantFeatures[feature_id]
  if (original) {
    const restored = structuredClone(original)
    restored.enabled = true
    updatedFeatures[feature_id] = restored
    return { updatedFeatures }
  }

  // Feature was never enabled — generate from global config
  const globalFeature = globalConfigs.find((g) => g.feature_id === feature_id)
  if (!globalFeature) {
    return {
      updatedFeatures,
      error: `Global config not found for feature_id: "${feature_id}"`,
    }
  }

  updatedFeatures[feature_id] = globalToTenantFeature(globalFeature, featureChild)
  return { updatedFeatures }
}

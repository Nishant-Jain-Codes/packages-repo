import merge from 'lodash.merge'
import type {
  GlobalFeatureConfig,
  TenantFeatureConfig,
  FeatureChild,
} from '../types'

/**
 * Converts a global feature config schema into a tenant feature config object.
 *
 * 1. Create scaffold: { enabled: true, strategies: {}, config: {}, services: {} }
 * 2. Populate config from global fields using default_value when present
 * 3. Apply feature_default overrides if provided
 * 4. Ensure enabled = true
 */
export function globalToTenantFeature(
  globalFeature: GlobalFeatureConfig,
  featureChild?: FeatureChild,
): TenantFeatureConfig {
  const result: TenantFeatureConfig = {
    enabled: true,
    strategies: {},
    config: {},
    services: {},
  }

  // Populate config from global field defaults
  for (const field of globalFeature.fields) {
    if (field.default_value !== undefined) {
      result.config[field.key] = structuredClone(field.default_value)
    }
  }

  // Apply feature_default overrides
  if (featureChild?.feature_default) {
    const overrides = featureChild.feature_default

    if (overrides.config && typeof overrides.config === 'object') {
      merge(result.config, overrides.config)
    }
    if (overrides.strategies && typeof overrides.strategies === 'object') {
      merge(result.strategies, overrides.strategies)
    }
    if (overrides.services && typeof overrides.services === 'object') {
      merge(result.services, overrides.services)
    }
  }

  // Always ensure enabled
  result.enabled = true

  return result
}

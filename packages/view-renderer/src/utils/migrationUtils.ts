import type { TenantConfig, GlobalFeatureConfig, AppTypeKey, TenantConfigMap, GlobalConfigMap } from '../types'

/** Wrap a single TenantConfig into a TenantConfigMap for backward compat */
export function singleConfigToMap(config: TenantConfig, key: AppTypeKey = 'default'): TenantConfigMap {
  return { [key]: config }
}

/** Wrap a single GlobalFeatureConfig[] into a GlobalConfigMap */
export function singleGlobalToMap(configs: GlobalFeatureConfig[], key: AppTypeKey = 'default'): GlobalConfigMap {
  return { [key]: configs }
}

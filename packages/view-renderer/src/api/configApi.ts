import type { TenantConfig, GlobalFeatureConfig } from '../types'

export interface FetchTenantConfigParams {
  tenant: string
  env: string
  appType?: string
  appVersion?: string
  role?: string
}

/**
 * GET /tenant-config — caller provides baseUrl (e.g. "http://localhost:3000" or "/v1")
 */
export async function fetchTenantConfig(
  baseUrl: string,
  params: FetchTenantConfigParams,
): Promise<TenantConfig> {
  const query = new URLSearchParams()
  query.set('tenant', params.tenant)
  query.set('env', params.env)
  if (params.appType) query.set('appType', params.appType)
  if (params.appVersion) query.set('appVersion', params.appVersion)
  if (params.role) query.set('role', params.role)

  const res = await fetch(`${baseUrl}/tenant-config?${query.toString()}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  const data = await res.json()
  return data.config ?? data
}

/**
 * GET /app/resolved_config — caller provides baseUrl
 */
export async function fetchGlobalConfigs(
  baseUrl: string,
): Promise<GlobalFeatureConfig[]> {
  const res = await fetch(`${baseUrl}/app/resolved_config`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  const data = await res.json()
  const configs = data.config ?? data
  return Array.isArray(configs) ? configs : []
}

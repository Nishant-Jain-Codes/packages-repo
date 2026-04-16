import type { PortalConfig, Activity, FormSchema } from '@aditya-sharma-salescode/form-builder'
import type { ViewMetaReport } from '@aditya-sharma-salescode/reports-setup'
import type { DraftMap, TenantFeatureConfig } from '../types'

export function tenantFeatureToActivity(
  activityId: string,
  feature: TenantFeatureConfig,
): Activity {
  const config = feature.config as Record<string, unknown> | undefined
  const schema = (config?.schema ?? {}) as FormSchema
  return {
    id: activityId,
    name: schema.formName ?? activityId,
    description: '',
    enabled: feature.enabled,
    schema: {
      formId: schema.formId ?? activityId,
      formName: schema.formName ?? activityId,
      version: schema.version ?? '1.0',
      sections: schema.sections ?? [],
      meta: schema.meta ?? {
        submitLabel: 'Submit',
        submitEndpoint: '/api/forms/submit',
        createdAt: new Date().toISOString(),
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function buildFormBuilderConfig(
  draftMap: DraftMap | null,
  catalog: ViewMetaReport[],
): PortalConfig {
  return {
    app: draftMap?.app ? { tenant_id: draftMap.app.tenant_id } : {},
    viewMeta: { reports: catalog },
    features: {
      app: draftMap?.app?.features?.app
        ? { ...(draftMap.app.features.app as unknown as Record<string, unknown>) }
        : { enabled: true, config: { schema: [] } },
      reports: draftMap?.portal?.features?.reports
        ? { ...(draftMap.portal.features.reports as unknown as Record<string, unknown>) }
        : { enabled: true, config: { report_list: [] } },
    },
  }
}

export function applyFormBuilderSchemaUpdate(
  activityId: string,
  schema: unknown,
  setDraftMap: (fn: (prev: DraftMap | null) => DraftMap | null) => void,
) {
  setDraftMap((prev) => {
    if (!prev?.app) return prev
    const currentFeature = prev.app.features[activityId]
    if (!currentFeature) return prev
    return {
      ...prev,
      app: {
        ...prev.app,
        features: {
          ...prev.app.features,
          [activityId]: {
            ...currentFeature,
            config: {
              ...(currentFeature.config as Record<string, unknown>),
              schema,
            },
          },
        },
      },
    }
  })
}

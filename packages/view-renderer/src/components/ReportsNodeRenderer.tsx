import { useMemo, useCallback } from 'react'
import { ReportsProvider, ManageReports } from '@aditya-sharma-salescode/reports-setup'
import type { AppConfig, ViewMetaReport } from '@aditya-sharma-salescode/reports-setup'
import { useViewRenderer } from '../context/ViewRendererContext'
import { buildReportsConfig, applyReportsConfigUpdate } from '../utils/reportsConfigUtils'

export function ReportsNodeRenderer() {
  const { currentNodeMeta, handleAdvancedSettings, draftMap, setDraftMap } = useViewRenderer()
  const catalog = (currentNodeMeta?.data?.reports_catalog ?? []) as ViewMetaReport[]

  const portalConfig = useMemo(
    () => buildReportsConfig(draftMap, catalog),
    [draftMap, catalog],
  )

  const handleConfigUpdate = useCallback(
    (updated: AppConfig) => applyReportsConfigUpdate(updated, setDraftMap),
    [setDraftMap],
  )

  const handleEditReport = useCallback(
    (reportId: string) => handleAdvancedSettings(reportId),
    [handleAdvancedSettings],
  )

  return (
    <ReportsProvider
      config={{
        initialConfig: portalConfig,
        onConfigUpdate: handleConfigUpdate,
        onEditReport: handleEditReport,
      }}
    >
      <ManageReports minimal />
    </ReportsProvider>
  )
}

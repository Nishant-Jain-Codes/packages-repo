import { type CSSProperties, useCallback, useMemo } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import {
  ReportsProvider,
  ReportConfigPage,
} from '@aditya-sharma-salescode/reports-setup'
import type { AppConfig, ViewMetaReport, ReportCard } from '@aditya-sharma-salescode/reports-setup'
import { useViewRenderer } from '../context/ViewRendererContext'
import {
  buildReportsConfig,
  applyReportsConfigUpdate,
  viewMetaToReportCards,
  reportCardsToViewMeta,
} from '../utils/reportsConfigUtils'

export interface ReportsEditModalProps {
  reportId: string
  onClose: () => void
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  } as CSSProperties,
  panel: {
    background: '#fff',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  } as CSSProperties,
  body: {
    flex: 1,
    overflow: 'auto',
  } as CSSProperties,
}

export function ReportsEditModal({ reportId, onClose }: ReportsEditModalProps) {
  const { currentNodeMeta, draftMap, setDraftMap } = useViewRenderer()
  const catalog = (currentNodeMeta?.data?.reports_catalog ?? []) as ViewMetaReport[]

  const appConfig = useMemo(
    () => buildReportsConfig(draftMap, catalog),
    [draftMap, catalog],
  )

  const handleConfigUpdate = useCallback(
    (updated: AppConfig) => applyReportsConfigUpdate(updated, setDraftMap),
    [setDraftMap],
  )

  // Convert enabled report_list → ReportCard[] for ReportConfigPage
  const initialCards = useMemo(() => {
    const reportList = appConfig.features?.reports?.config?.report_list ?? []
    return viewMetaToReportCards(reportList)
  }, [appConfig])

  // When ReportConfigPage mutates cards, convert back and push into draftMap
  const handleCardsUpdate = useCallback(
    (cards: ReportCard[]) => {
      const updatedReportList = reportCardsToViewMeta(cards)
      const updatedConfig: AppConfig = {
        ...appConfig,
        features: {
          ...appConfig.features,
          reports: {
            ...appConfig.features?.reports,
            enabled: true,
            config: {
              ...appConfig.features?.reports?.config,
              report_list: updatedReportList,
            },
          },
        },
      }
      applyReportsConfigUpdate(updatedConfig, setDraftMap)
    },
    [appConfig, setDraftMap],
  )

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.body}>
          <MemoryRouter initialEntries={['/report-config']}>
            <ReportsProvider
              config={{
                initialConfig: appConfig,
                onConfigUpdate: handleConfigUpdate,
                initialCards,
                onCardsUpdate: handleCardsUpdate,
                selectedReportId: reportId,
                onClose: handleClose,
                hideBackToList: true,
                showPreview: false,
                showSaveAll: false,
                showVoiceAssisted: false,
                showFooterSave: false,
                showRoleSwitcher: false,
                showUndo: false,
                showAutoSuggest: false,
              }}
            >
              <Routes>
                <Route path="/report-config" element={<ReportConfigPage />} />
                <Route path="*" element={<ReportConfigPage />} />
              </Routes>
            </ReportsProvider>
          </MemoryRouter>
        </div>
      </div>
    </div>
  )
}

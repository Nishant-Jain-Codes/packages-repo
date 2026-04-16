import React, { createContext, useContext } from "react";
import type { AppConfig } from "./manage/types";
import type { ReportCard } from "./config/types";

export interface ReportsFeatures {
  /** Show the report config editor page. Default: true */
  reportConfig?: boolean;
  /** Show the report preview/filter tester page. Default: true */
  reportPreview?: boolean;
  /** Show the reports portal page. Default: true */
  reportsPortal?: boolean;
  /** Show the manage reports page. Default: true */
  manageReports?: boolean;
}

export interface ReportsServiceOverrides {
  /** Override how report configs are loaded */
  loadReportConfig?: (reportKey: string) => Promise<unknown>;
  /** Override how report configs are saved */
  saveReportConfig?: (reportKey: string, config: unknown) => Promise<void>;
}

export interface ReportsConfig {
  features?: ReportsFeatures;
  endpoints?: Record<string, string>;
  services?: ReportsServiceOverrides;

  // ── ManageReports integration ──────────────────────────────────────────────

  /**
   * The full tenant / app JSON containing `viewMeta.reports` (catalog) and
   * optionally `features.reports.config.report_list` (already-enabled reports).
   * Pass this so ManageReports can initialise from existing state.
   */
  initialConfig?: AppConfig;

  /**
   * Called every time the user toggles or edits a report in ManageReports.
   * Receives the full updated config JSON — wire this to your persistence layer.
   *
   * @example
   * onConfigUpdate={(cfg) => localStorage.setItem("appConfig", JSON.stringify(cfg))}
   * @example
   * onConfigUpdate={(cfg) => api.saveConfig(tenantId, cfg)}
   */
  onConfigUpdate?: (updatedConfig: AppConfig) => void;

  /**
   * Called when the user clicks the ⚙ settings icon on a report card.
   * Receives the report's `id` — navigate to your config editor here.
   *
   * @example
   * onEditReport={(id) => navigate(`/report-config?reportId=${id}`)}
   */
  onEditReport?: (reportId: string) => void;

  // ── ReportConfigPage controlled mode ──────────────────────────────────────

  /**
   * When set, ReportConfigPage initialises from these cards instead of
   * localStorage. Pass the report cards from your own state.
   */
  initialCards?: ReportCard[];

  /**
   * Called on every card mutation inside ReportConfigPage.
   * Wire this to your persistence layer (e.g. setDraftMap).
   * When provided, ReportConfigPage will NOT write to localStorage.
   */
  onCardsUpdate?: (cards: ReportCard[]) => void;

  /**
   * Pre-select this report in ReportConfigPage on mount.
   */
  selectedReportId?: string;

  /**
   * Called when the user clicks the back/close button in ReportConfigPage.
   * Use this to close the modal or navigate away.
   * When not provided, falls back to navigate(-1).
   */
  onClose?: () => void;

  /**
   * When true, hides the "Back to list" button in ReportConfigPage footer.
   * Default: false (button is shown).
   */
  hideBackToList?: boolean;

  /** Show the Preview button in the header. Default: true */
  showPreview?: boolean;
  /** Show the Save All button in the header. Default: true */
  showSaveAll?: boolean;
  /** Show the Voice-assisted badge in the header. Default: true */
  showVoiceAssisted?: boolean;
  /** Show the Save Config button in the footer. Default: true */
  showFooterSave?: boolean;
  /** Show the role switcher dropdown in the header. Default: true */
  showRoleSwitcher?: boolean;
  /** Show the undo button in the header. Default: true */
  showUndo?: boolean;
  /** Show the auto-suggest strip in the config editor. Default: true */
  showAutoSuggest?: boolean;
}

// Context value shape (all fields required so consumers never get undefined)
interface ReportsConfigContextValue extends Required<Omit<ReportsConfig, "initialConfig" | "onConfigUpdate" | "onEditReport" | "initialCards" | "onCardsUpdate" | "selectedReportId" | "onClose" | "hideBackToList" | "showPreview" | "showSaveAll" | "showVoiceAssisted" | "showFooterSave" | "showRoleSwitcher" | "showUndo" | "showAutoSuggest">> {
  initialConfig: AppConfig | undefined;
  onConfigUpdate: ((updatedConfig: AppConfig) => void) | undefined;
  onEditReport: ((reportId: string) => void) | undefined;
  initialCards: ReportCard[] | undefined;
  onCardsUpdate: ((cards: ReportCard[]) => void) | undefined;
  selectedReportId: string | undefined;
  onClose: (() => void) | undefined;
  hideBackToList: boolean;
  showPreview: boolean;
  showSaveAll: boolean;
  showVoiceAssisted: boolean;
  showFooterSave: boolean;
  showRoleSwitcher: boolean;
  showUndo: boolean;
  showAutoSuggest: boolean;
}

const defaultConfig: ReportsConfigContextValue = {
  features: {
    reportConfig: true,
    reportPreview: true,
    reportsPortal: true,
    manageReports: true,
  },
  endpoints: {},
  services: {},
  initialConfig: undefined,
  onConfigUpdate: undefined,
  onEditReport: undefined,
  initialCards: undefined,
  onCardsUpdate: undefined,
  selectedReportId: undefined,
  onClose: undefined,
  hideBackToList: false,
  showPreview: true,
  showSaveAll: true,
  showVoiceAssisted: true,
  showFooterSave: true,
  showRoleSwitcher: true,
  showUndo: true,
  showAutoSuggest: true,
};

const ReportsConfigContext =
  createContext<ReportsConfigContextValue>(defaultConfig);

export const ReportsProvider: React.FC<{
  config?: ReportsConfig;
  children: React.ReactNode;
}> = ({ config = {}, children }) => {
  const merged: ReportsConfigContextValue = {
    ...defaultConfig,
    ...config,
    features: { ...defaultConfig.features, ...config.features },
    endpoints: { ...defaultConfig.endpoints, ...config.endpoints },
    services: { ...defaultConfig.services, ...config.services },
  };
  return (
    <ReportsConfigContext.Provider value={merged}>
      {children}
    </ReportsConfigContext.Provider>
  );
};

export const useReportsConfig = () => useContext(ReportsConfigContext);

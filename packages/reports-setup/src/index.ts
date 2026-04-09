// ─── Provider & Config ───────────────────────────────────
export { ReportsProvider, useReportsConfig } from "./provider";
export type { ReportsConfig, ReportsFeatures, ReportsServiceOverrides } from "./provider";

// ─── Report Configuration ────────────────────────────────
export { default as ReportConfigPage } from "./config/ReportConfigPage";
export { loadReportConfig, saveReportConfigLocal } from "./config/reportConfigService";
export { REPORT_CONFIG_ACTIONS, BEHAVIOR_FLAG_ALIASES, SECTION_ALIASES } from "./config/reportConfigRegistry";
export type { ReportCard, ReportBehaviorConfig } from "./config/types";

// ─── Report Preview ─────────────────────────────────────
export { default as ReportPreviewPage } from "./preview/ReportPreviewPage";

// ─── Reports Portal ─────────────────────────────────────
export { default as ReportsPage } from "./portal/ReportsPage";
export { syncReportsAuthLocalStorage } from "./portal/syncReportsAuth";

// ─── Voice Integration ──────────────────────────────────
export { buildReportConfigStaticPrompt, buildReportConfigContextUpdate } from "./config/voice/buildReportConfigPrompt";

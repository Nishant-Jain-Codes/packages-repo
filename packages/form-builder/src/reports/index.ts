/**
 * Reports — embedded within form-builder package.
 *
 * These are the same components as @aditya-sharma-salescode/reports-setup but wired
 * to the form-builder's voice agent and activity store via local imports.
 * When this form-builder directory becomes its own package, the reports
 * ship with it — no extra dependency needed.
 */

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

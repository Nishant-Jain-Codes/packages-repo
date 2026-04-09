// ─── Provider & Config ───────────────────────────────────
export { FormBuilderProvider, useFormBuilderConfig } from "./provider";
export type { FormBuilderConfig, FormBuilderFeatures, FormBuilderServiceOverrides } from "./provider";

// ─── Main Component ──────────────────────────────────────
export { FormBuilder } from "./FormBuilder";

// ─── Types ───────────────────────────────────────────────
export type * from "./types";

// ─── Voice Agent ─────────────────────────────────────────
export { VoiceAgentProvider, useVoiceAgentContext } from "./voice/VoiceAgentContext";

// ─── Hooks ───────────────────────────────────────────────
export { useActivityStore } from "./hooks/useActivityStore";

// ─── Embedded Reports (ships with form-builder) ──────────
export { ReportConfigPage } from "./reports/config/ReportConfigPage";
export { default as ReportPreviewPage } from "./reports/preview/ReportPreviewPage";
export { default as ReportsPage } from "./reports/portal/ReportsPage";
export { syncReportsAuthLocalStorage } from "./reports/portal/syncReportsAuth";

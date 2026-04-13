// ─── Provider & Config ───────────────────────────────────
export {
  FormBuilderProvider,
  useFormBuilderConfig,
} from "./provider";
export type {
  FormBuilderConfig,
  FormBuilderContextValue,
  FormBuilderFeatures,
  FormBuilderServiceOverrides,
  FormBuilderResolvedRoutes,
} from "./provider";

// ─── Routes (match React Router paths to `routePrefix` on the provider) ───
export { buildFormBuilderRoutes, resolveLegacyNavigatePath } from "./routes";

// ─── Shell: voice session + panel across manage / builder / reports ───
export { FormBuilderLayout } from "./voice/FormBuilderLayout";

// ─── Plug-and-play (routes + provider in one) ───────────────────────────
export { FormBuilderPlugIn, FormBuilderStandalone } from "./FormBuilderPlugIn";
export type { FormBuilderPlugInProps, FormBuilderStandaloneProps } from "./FormBuilderPlugIn";

// ─── Main screens ─────────────────────────────────────────
export { FormBuilder } from "./FormBuilder";
export { ManageForms } from "./components/ManageForms/ManageForms";

// ─── Types ───────────────────────────────────────────────
export type * from "./types";

// ─── Voice Agent ─────────────────────────────────────────
export { VoiceAgentProvider, useVoiceAgentContext } from "./voice/VoiceAgentContext";
export type { UICallbacks } from "./voice/VoiceAgentContext";
export { useConvaiAgent } from "./voice/useConvaiAgent";
export type { ConvaiStatus, ConvaiState } from "./voice/useConvaiAgent";
export type { AgentStage, VoiceAgentState, VoiceAgentActions } from "./voice/useVoiceAgent";

// ─── Hooks ───────────────────────────────────────────────
export { useActivityStore } from "./hooks/useActivityStore";

// ─── Embedded Reports (ships with form-builder) ──────────
export { default as ReportConfigPage } from "./reports/config/ReportConfigPage";
export { default as ReportPreviewPage } from "./reports/preview/ReportPreviewPage";
export { default as ReportsPage } from "./reports/portal/ReportsPage";
export {
  REPORTS_ACCOUNT_ID,
  syncReportsAuthLocalStorage,
} from "./reports/portal/syncReportsAuth";

// Optional shell pieces (e.g. embedded portals) — same stack as FormBuilderLayout.
export { VoiceActionFeedProvider } from "./voice/VoiceActionFeedContext";
export { VoiceAgentPanel } from "./voice/VoiceAgentPanel";

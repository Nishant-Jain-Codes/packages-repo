import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FormBuilderProvider } from "./provider";
import { FormBuilderLayout } from "./voice/FormBuilderLayout";
import { ManageForms } from "./components/ManageForms/ManageForms";
import { FormBuilder } from "./FormBuilder";
import ReportConfigPage from "./reports/config/ReportConfigPage";
import ReportPreviewPage from "./reports/preview/ReportPreviewPage";
import ReportsPage from "./reports/portal/ReportsPage";

export interface FormBuilderPlugInProps {
  /**
   * URL prefix for all in-package links (no trailing slash).
   * Must match the parent route, e.g. `<Route path="/app/forms/*" element={<FormBuilderPlugIn routePrefix="/app/forms" />} />`.
   */
  routePrefix?: string;
  /**
   * `nested` — default; mount under `path="…/*"` and use relative child paths.
   * `root` — use inside `<BrowserRouter>` at the app root (absolute redirects).
   */
  mode?: "nested" | "root";
}

/**
 * All form-builder + reports + voice routes in one tree.
 *
 * Nested (typical in an existing app):
 * ```tsx
 * <Route path="/suite/*" element={<FormBuilderPlugIn routePrefix="/suite" />} />
 * ```
 */
export function FormBuilderPlugIn({
  routePrefix = "",
  mode = "nested",
}: FormBuilderPlugInProps) {
  const prefix = routePrefix.replace(/\/$/, "");
  const indexTo =
    mode === "root"
      ? prefix
        ? `${prefix}/manage-forms`
        : "/manage-forms"
      : "manage-forms";

  return (
    <FormBuilderProvider config={{ routePrefix: prefix }}>
      <Routes>
        <Route element={<FormBuilderLayout />}>
          <Route index element={<Navigate to={indexTo} replace />} />
          <Route path="manage-forms" element={<ManageForms />} />
          <Route path="form-builder/:activityId?" element={<FormBuilder />} />
          <Route path="report-config" element={<ReportConfigPage />} />
          <Route path="report-preview" element={<ReportPreviewPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </FormBuilderProvider>
  );
}

export interface FormBuilderStandaloneProps {
  /** Optional prefix, e.g. `/forms` → URLs `/forms/manage-forms`, … */
  routePrefix?: string;
}

/** Install, import, render — includes `BrowserRouter`. */
export function FormBuilderStandalone({ routePrefix = "" }: FormBuilderStandaloneProps) {
  return (
    <BrowserRouter>
      <FormBuilderPlugIn routePrefix={routePrefix} mode="root" />
    </BrowserRouter>
  );
}

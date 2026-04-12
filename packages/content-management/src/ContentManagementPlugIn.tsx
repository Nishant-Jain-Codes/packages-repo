import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { contentManagementStore } from "./reduxStore";
import { ContentManagementProvider } from "./provider";
import { UnifiedManagementPage } from "./unified-management/UnifiedManagementPage";

export interface ContentManagementPlugInProps {
  /**
   * URL prefix (no trailing slash). Use the same value in the parent route:
   * `<Route path="/content/*" element={<ContentManagementPlugIn routePrefix="/content" />} />`
   */
  routePrefix?: string;
  /** `nested` under `path="…/*"`; `root` for use inside an existing root router with absolute redirects. */
  mode?: "nested" | "root";
}

/**
 * Full content-management shell: Redux + config + all section/create routes.
 * Renders {@link UnifiedManagementPage} for every path; the page syncs from the URL.
 */
export function ContentManagementPlugIn({
  routePrefix = "/content",
  mode = "nested",
}: ContentManagementPlugInProps) {
  const prefix = routePrefix.replace(/\/$/, "") || "/content";
  const indexTo =
    mode === "root" ? `${prefix}/banner` : "banner";

  return (
    <Provider store={contentManagementStore}>
      <ContentManagementProvider config={{ routePrefix: prefix }}>
        <Routes>
          <Route index element={<Navigate to={indexTo} replace />} />
          <Route path="banner" element={<UnifiedManagementPage />} />
          <Route path="bucket" element={<UnifiedManagementPage />} />
          <Route path="basket" element={<UnifiedManagementPage />} />
          <Route path="block" element={<UnifiedManagementPage />} />
          <Route path="homeScreenManagement" element={<UnifiedManagementPage />} />
          <Route path="create-banner" element={<UnifiedManagementPage />} />
          <Route path="create-bucket" element={<UnifiedManagementPage />} />
          <Route path="create-basket" element={<UnifiedManagementPage />} />
          <Route path="create-block" element={<UnifiedManagementPage />} />
        </Routes>
      </ContentManagementProvider>
    </Provider>
  );
}

export interface ContentManagementStandaloneProps {
  routePrefix?: string;
}

/** Includes `BrowserRouter` — drop in at app root for a zero-config demo. */
export function ContentManagementStandalone({
  routePrefix = "/content",
}: ContentManagementStandaloneProps) {
  const prefix = routePrefix.replace(/\/$/, "") || "/content";
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={`${prefix}/*`}
          element={<ContentManagementPlugIn routePrefix={prefix} mode="nested" />}
        />
        <Route path="/" element={<Navigate to={`${prefix}/banner`} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

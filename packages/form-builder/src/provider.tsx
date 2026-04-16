import React, { createContext, useContext, useMemo } from "react";
import { buildFormBuilderRoutes, type FormBuilderResolvedRoutes } from "./routes";
import type { PortalConfig } from "./manage/types";

export type { PortalConfig } from "./manage/types";

export interface FormBuilderFeatures {
  /** Include report config + preview pages. Default: true */
  reports?: boolean;
  /** Show Jira fetch/generate prompt bar in Form Builder header. Default: true */
  fetchJira?: boolean;
  /** Show JSON viewer button/dialog in Form Builder header. Default: true */
  jsonViewer?: boolean;
  /** Show JSON import button in Form Builder header. Default: true */
  jsonImport?: boolean;
  /** Show JSON export/download buttons in Form Builder header. Default: true */
  jsonExport?: boolean;
  /** Show dark/light mode toggle button. Default: true */
  darkModeToggle?: boolean;
  /** Show Save button. Default: true */
  saveButton?: boolean;
  /** Show AI prompt bar (Jira fetch UI on small screens). Default: true */
  aiPromptBar?: boolean;
}

export interface FormBuilderServiceOverrides {
  /** Override Jira proxy endpoint */
  jiraProxyUrl?: string;
  /** Override AI form generation endpoint */
  aiGenerateUrl?: string;
  /** Override the fetch used for Jira calls */
  fetchJiraIssue?: (issueKey: string) => Promise<unknown>;
}

export interface FormBuilderConfig {
  features?: FormBuilderFeatures;
  endpoints?: Record<string, string>;
  services?: FormBuilderServiceOverrides;
  /**
   * Prefix for all form-builder routes (no trailing slash).
   * Example: `/admin/suite` → `/admin/suite/manage-forms`, `/admin/suite/form-builder/:id`, etc.
   */
  routePrefix?: string;

  // ── ManageForms config integration ────────────────────────────────────────

  /**
   * The full tenant / app JSON. If `features.app.config.schema` is present,
   * ManageForms will initialise its activity list from it instead of localStorage.
   * Toggling a form also updates `features.reports.config.report_list`.
   *
   * @example
   * initialConfig={tenantJson}
   */
  initialConfig?: PortalConfig;

  /**
   * Called after every toggle / add / remove in ManageForms.
   * Receives the full updated PortalConfig — wire to your persistence layer.
   *
   * @example
   * onConfigUpdate={(cfg) => localStorage.setItem("portalConfig", JSON.stringify(cfg))}
   * @example
   * onConfigUpdate={(cfg) => api.savePortalConfig(tenantId, cfg)}
   */
  onConfigUpdate?: (updatedConfig: PortalConfig) => void;
}

export type { FormBuilderResolvedRoutes };

export interface FormBuilderContextValue
  extends Required<
    Omit<FormBuilderConfig, "routePrefix" | "initialConfig" | "onConfigUpdate">
  > {
  /** Normalized prefix (no trailing slash), may be empty */
  routePrefix: string;
  routes: FormBuilderResolvedRoutes;
  initialConfig: PortalConfig | undefined;
  onConfigUpdate: ((updatedConfig: PortalConfig) => void) | undefined;
}

const defaultRoutePrefix = "";
const defaultRoutes = buildFormBuilderRoutes(defaultRoutePrefix);

const defaultContextValue: FormBuilderContextValue = {
  features: {
    reports: true,
    fetchJira: true,
    jsonViewer: true,
    jsonImport: true,
    jsonExport: true,
    darkModeToggle: true,
    saveButton: true,
    aiPromptBar: true,
  },
  endpoints: {},
  services: {},
  routePrefix: defaultRoutePrefix,
  routes: defaultRoutes,
  initialConfig: undefined,
  onConfigUpdate: undefined,
};

const FormBuilderConfigContext = createContext<FormBuilderContextValue>(defaultContextValue);

export const FormBuilderProvider: React.FC<{
  config?: FormBuilderConfig;
  children: React.ReactNode;
}> = ({ config = {}, children }) => {
  const routePrefix = useMemo(
    () => (config.routePrefix ?? "").replace(/\/$/, ""),
    [config.routePrefix]
  );
  const routes = useMemo(() => buildFormBuilderRoutes(routePrefix), [routePrefix]);

  const value = useMemo<FormBuilderContextValue>(
    () => ({
      features: { ...defaultContextValue.features, ...config.features },
      endpoints: { ...defaultContextValue.endpoints, ...config.endpoints },
      services: { ...defaultContextValue.services, ...config.services },
      routePrefix,
      routes,
      initialConfig: config.initialConfig,
      onConfigUpdate: config.onConfigUpdate,
    }),
    [config.features, config.endpoints, config.services, config.initialConfig, config.onConfigUpdate, routePrefix, routes]
  );

  return (
    <FormBuilderConfigContext.Provider value={value}>
      {children}
    </FormBuilderConfigContext.Provider>
  );
};

export const useFormBuilderConfig = () => useContext(FormBuilderConfigContext);

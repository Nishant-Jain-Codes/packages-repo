import React, { createContext, useContext, useMemo } from "react";
import { buildFormBuilderRoutes, type FormBuilderResolvedRoutes } from "./routes";

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
}

export type { FormBuilderResolvedRoutes };

export interface FormBuilderContextValue extends Required<Omit<FormBuilderConfig, "routePrefix">> {
  /** Normalized prefix (no trailing slash), may be empty */
  routePrefix: string;
  routes: FormBuilderResolvedRoutes;
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
  },
  endpoints: {},
  services: {},
  routePrefix: defaultRoutePrefix,
  routes: defaultRoutes,
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
    }),
    [config.features, config.endpoints, config.services, routePrefix, routes]
  );

  return (
    <FormBuilderConfigContext.Provider value={value}>
      {children}
    </FormBuilderConfigContext.Provider>
  );
};

export const useFormBuilderConfig = () => useContext(FormBuilderConfigContext);

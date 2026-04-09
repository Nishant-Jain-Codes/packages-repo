import React, { createContext, useContext } from "react";

export interface ReportsFeatures {
  /** Show the report config editor page. Default: true */
  reportConfig?: boolean;
  /** Show the report preview/filter tester page. Default: true */
  reportPreview?: boolean;
  /** Show the reports portal page. Default: true */
  reportsPortal?: boolean;
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
}

const defaultConfig: Required<ReportsConfig> = {
  features: { reportConfig: true, reportPreview: true, reportsPortal: true },
  endpoints: {},
  services: {},
};

const ReportsConfigContext = createContext<Required<ReportsConfig>>(defaultConfig);

export const ReportsProvider: React.FC<{
  config?: ReportsConfig;
  children: React.ReactNode;
}> = ({ config = {}, children }) => {
  const merged: Required<ReportsConfig> = {
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

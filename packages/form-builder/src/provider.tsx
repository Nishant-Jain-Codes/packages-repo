import React, { createContext, useContext } from "react";

export interface FormBuilderFeatures {
  /** Include report config + preview pages. Default: true */
  reports?: boolean;
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
}

const defaultConfig: Required<FormBuilderConfig> = {
  features: { reports: true },
  endpoints: {},
  services: {},
};

const FormBuilderConfigContext = createContext<Required<FormBuilderConfig>>(defaultConfig);

export const FormBuilderProvider: React.FC<{
  config?: FormBuilderConfig;
  children: React.ReactNode;
}> = ({ config = {}, children }) => {
  const merged: Required<FormBuilderConfig> = {
    ...defaultConfig,
    ...config,
    features: { ...defaultConfig.features, ...config.features },
    endpoints: { ...defaultConfig.endpoints, ...config.endpoints },
    services: { ...defaultConfig.services, ...config.services },
  };
  return (
    <FormBuilderConfigContext.Provider value={merged}>
      {children}
    </FormBuilderConfigContext.Provider>
  );
};

export const useFormBuilderConfig = () => useContext(FormBuilderConfigContext);

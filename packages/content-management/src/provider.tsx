import React, { createContext, useContext } from "react";

export interface ContentManagementFeatures {
  /** Show banner management. Default: true */
  banner?: boolean;
  /** Show bucket management. Default: true */
  bucket?: boolean;
  /** Show basket management. Default: true */
  basket?: boolean;
  /** Show block management. Default: true */
  block?: boolean;
  /** Show home screen management. Default: true */
  homescreen?: boolean;
}

export interface ContentManagementServiceOverrides {
  /** Override the base API URL for all content management calls */
  baseApiUrl?: string;
  /** Override the network GET function */
  networkGet?: (url: string, params?: Record<string, unknown>) => Promise<unknown>;
  /** Override the network POST function */
  networkPost?: (url: string, body: unknown) => Promise<unknown>;
  /** Override the network DELETE function */
  networkDelete?: (url: string) => Promise<unknown>;
}

export interface ContentManagementConfig {
  features?: ContentManagementFeatures;
  endpoints?: Record<string, string>;
  services?: ContentManagementServiceOverrides;
}

const defaultConfig: Required<ContentManagementConfig> = {
  features: {
    banner: true,
    bucket: true,
    basket: true,
    block: true,
    homescreen: true,
  },
  endpoints: {},
  services: {},
};

const ContentManagementConfigContext =
  createContext<Required<ContentManagementConfig>>(defaultConfig);

export const ContentManagementProvider: React.FC<{
  config?: ContentManagementConfig;
  children: React.ReactNode;
}> = ({ config = {}, children }) => {
  const merged: Required<ContentManagementConfig> = {
    ...defaultConfig,
    ...config,
    features: { ...defaultConfig.features, ...config.features },
    endpoints: { ...defaultConfig.endpoints, ...config.endpoints },
    services: { ...defaultConfig.services, ...config.services },
  };
  return (
    <ContentManagementConfigContext.Provider value={merged}>
      {children}
    </ContentManagementConfigContext.Provider>
  );
};

export const useContentManagementConfig = () =>
  useContext(ContentManagementConfigContext);

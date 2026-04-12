import React, { createContext, useContext, useMemo } from "react";
import {
  buildContentManagementRoutes,
  type ContentManagementResolvedRoutes,
} from "./contentRoutes";

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
  /**
   * Prefix for all content-management URLs (no trailing slash).
   * Example: `/content` → `/content/banner`, `/content/create-banner`, …
   */
  routePrefix?: string;
  /** Target for "Back to dashboard" (sidebar). Default `/dashboard`. */
  exitPath?: string;
}

export type { ContentManagementResolvedRoutes };

export interface ContentManagementContextValue
  extends Required<Omit<ContentManagementConfig, "routePrefix" | "exitPath">> {
  routePrefix: string;
  exitPath: string;
  routes: ContentManagementResolvedRoutes;
}

const defaultFeatures = {
  banner: true,
  bucket: true,
  basket: true,
  block: true,
  homescreen: true,
};

const defaultRoutes = buildContentManagementRoutes("");

const defaultContextValue: ContentManagementContextValue = {
  features: defaultFeatures,
  endpoints: {},
  services: {},
  routePrefix: "",
  exitPath: "/dashboard",
  routes: defaultRoutes,
};

const ContentManagementConfigContext =
  createContext<ContentManagementContextValue>(defaultContextValue);

export const ContentManagementProvider: React.FC<{
  config?: ContentManagementConfig;
  children: React.ReactNode;
}> = ({ config = {}, children }) => {
  const routePrefix = useMemo(
    () => (config.routePrefix ?? "").replace(/\/$/, ""),
    [config.routePrefix]
  );
  const routes = useMemo(
    () => buildContentManagementRoutes(routePrefix),
    [routePrefix]
  );

  const value = useMemo<ContentManagementContextValue>(
    () => ({
      features: { ...defaultFeatures, ...config.features },
      endpoints: { ...defaultContextValue.endpoints, ...config.endpoints },
      services: { ...defaultContextValue.services, ...config.services },
      routePrefix,
      exitPath: config.exitPath ?? defaultContextValue.exitPath,
      routes,
    }),
    [
      config.features,
      config.endpoints,
      config.services,
      config.exitPath,
      routePrefix,
      routes,
    ]
  );

  return (
    <ContentManagementConfigContext.Provider value={value}>
      {children}
    </ContentManagementConfigContext.Provider>
  );
};

export const useContentManagementConfig = (): ContentManagementContextValue =>
  useContext(ContentManagementConfigContext);

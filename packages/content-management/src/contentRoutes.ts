export interface ContentManagementResolvedRoutes {
  banner: string;
  bucket: string;
  basket: string;
  block: string;
  homeScreenManagement: string;
  createBanner: string;
  createBucket: string;
  createBasket: string;
  createBlock: string;
  /** CreateBlock success targets (legacy dashboard paths mapped to prefixed routes) */
  dashboardBanner: string;
  dashboardCreateBucket: string;
  dashboardCreateBasket: string;
}

export function buildContentManagementRoutes(routePrefix: string): ContentManagementResolvedRoutes {
  const p = (routePrefix ?? "").replace(/\/$/, "");
  const withP = (path: string) => {
    const seg = path.startsWith("/") ? path : `/${path}`;
    return p ? `${p}${seg}` : seg;
  };
  return {
    banner: withP("/banner"),
    bucket: withP("/bucket"),
    basket: withP("/basket"),
    block: withP("/block"),
    homeScreenManagement: withP("/homeScreenManagement"),
    createBanner: withP("/create-banner"),
    createBucket: withP("/create-bucket"),
    createBasket: withP("/create-basket"),
    createBlock: withP("/create-block"),
    dashboardBanner: withP("/banner"),
    dashboardCreateBucket: withP("/create-bucket"),
    dashboardCreateBasket: withP("/create-basket"),
  };
}

/** Path after optional prefix, e.g. `/content/banner` + prefix `/content` → `/banner` */
export function stripRoutePrefix(pathname: string, routePrefix: string): string {
  const p = routePrefix.replace(/\/$/, "");
  if (!p) return pathname;
  if (pathname === p || pathname.startsWith(`${p}/`)) {
    const rest = pathname.slice(p.length) || "/";
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return pathname;
}

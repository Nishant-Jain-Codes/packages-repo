// ─── Provider & Config ───────────────────────────────────
export {
  ContentManagementProvider,
  useContentManagementConfig,
} from "./provider";
export type {
  ContentManagementConfig,
  ContentManagementContextValue,
  ContentManagementFeatures,
  ContentManagementServiceOverrides,
  ContentManagementResolvedRoutes,
} from "./provider";

// ─── Routes ─────────────────────────────────────────────
export {
  buildContentManagementRoutes,
  stripRoutePrefix,
} from "./contentRoutes";

// ─── Plug-and-play (all pages + Redux) ───────────────────
export {
  ContentManagementPlugIn,
  ContentManagementStandalone,
} from "./ContentManagementPlugIn";
export type {
  ContentManagementPlugInProps,
  ContentManagementStandaloneProps,
} from "./ContentManagementPlugIn";

export { contentManagementStore } from "./reduxStore";
export type { ContentManagementRootState } from "./reduxStore";

// ─── Pages ───────────────────────────────────────────────
export { BannerPage } from "./banner/BannerPage";
export { BucketPage } from "./bucket/BucketPage";
export { BasketPage } from "./basket/BasketPage";
export { BlockPage } from "./block/BlockPage";
export { UnifiedManagementPage } from "./unified-management/UnifiedManagementPage";

// ─── Contexts / Providers ────────────────────────────────
export { BannerProvider, useBanner } from "./banner/BannerContext";
export { BucketProvider, useBucket } from "./bucket/BucketContext";
export { BasketProvider, useBasket } from "./basket/BasketContext";
export { BlockProvider, useBlock } from "./block/BlockContext";

// ─── Create flows ────────────────────────────────────────
export { default as CreateNewBanner } from "./banner/create/createNewBanner";
export { default as CreateBucket } from "./bucket/create/CreateBucket";
export { default as CreateBasket } from "./basket/create/CreateBasket";
export { default as CreateBlock } from "./block/create/CreateBlock";

// ─── Types ───────────────────────────────────────────────
export type * from "./banner/types";
export type * from "./bucket/types";
export type * from "./basket/types";
export type * from "./block/types";
export type * from "./banner/create/bannerTypes";
export type * from "./bucket/create/CreateBucketTypes";
export type * from "./block/create/CreateBlockTypes";

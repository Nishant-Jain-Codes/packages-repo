import { configureStore } from "@reduxjs/toolkit";

function roleStateReducer(
  state = { role: { id: "generic", label: "Generic" } as { id: string; label: string } },
  action: { type?: string; payload?: { id: string; label: string } }
) {
  if (action.type === "setCurrentRole" && action.payload) {
    return { role: action.payload };
  }
  return state;
}

function manageCouponsReducer(
  state = {
    configData: {
      marketLevelTabsList: [] as unknown[],
      outletLevelTabsList: [] as unknown[],
    },
  }
) {
  return state;
}

function bannerStateReducer(
  state = { isUpdated: false as boolean, currentBanner: null as unknown },
  action: { type?: string; payload?: Record<string, unknown> }
) {
  switch (action.type) {
    case "setCurrentBanner":
      return {
        ...state,
        currentBanner: action.payload?.bannerState ?? null,
      };
    case "resetBanner":
      return { ...state, isUpdated: false, currentBanner: null };
    case "setBannerUpdateStatus":
      return {
        ...state,
        isUpdated: Boolean(action.payload?.isUpdated),
      };
    default:
      return state;
  }
}

function genericFilterReducer(state = {} as Record<string, unknown>) {
  return state;
}

/** Minimal store for plug-and-play; matches legacy `store.dispatch` action types. */
export const contentManagementStore = configureStore({
  reducer: {
    roleState: roleStateReducer,
    manageCoupons: manageCouponsReducer,
    bannerState: bannerStateReducer,
    genericFilter: genericFilterReducer,
  },
});

export type ContentManagementRootState = ReturnType<
  typeof contentManagementStore.getState
>;

import React from "react";
import { BannerStep } from "./types";
import CreateNewBanner from "@/features/content-management/banner/create/createNewBanner";
import NewManageBanner from "@/features/content-management/banner/manage/NewManageBanner";

export const BANNER_STEPS: BannerStep[] = [
  {
    id: "manage-banner",
    title: "Manage Banners",
    subtitle: "View and manage all banners",
    component: NewManageBanner,
  },
  {
    id: "create-banner",
    title: "Create/Edit Banner",
    subtitle: "Create new banner or edit existing",
    component: CreateNewBanner,
  },
];

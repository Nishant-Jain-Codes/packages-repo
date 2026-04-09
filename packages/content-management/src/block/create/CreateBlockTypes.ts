import { Banner } from "@/types";
import { viewType } from "@/features/content-management/bucket/create/CreateBucketTypes";
import { blockInnerComponent } from "@/utils/UtilityService";

export interface CreateBlockSubmitProps{
    handleParentDataSubmit?: (innerComponent?: blockInnerComponent) => Promise<void>,
    validateAllParentInputs?: () => string,
    redirectToRef?:any
}
export type retailerAppLayoutConfigType = "widgetLayout" | "formLayout" | "reportLayout";
export interface retailerAppLayoutConfigObj{
    name: string;
    type: retailerAppLayoutConfigType;
    value: any[];
    docUrl: string;
    defaultValue: any
    description: string,
    possibleVals: retailerAppLayoutConfigType[]
}
export interface blockBannerSelectionProps {
    banners: Banner[],
    setBanners: React.Dispatch<React.SetStateAction<Banner[]>>,
    bannerIds?: string[],
    bannerTemplates: string[],
    label: string,
    allBlocks: any[],
    view: "edit" | "create",
    showAllSelected?: boolean,
    handleSubmit?:any,
    redirectToRef?:any,
    setIsChange?:any,
    currentBlock?:any
}
export interface BannerSelectionWrapperProps {
    bannerIds?: string[],
    template: string,
    allBlocks: any[],
    view: "edit" | "create"
}
export interface BlockObjType {
    id: string,
    name: string,
    type: string,
    bannerIds?: string[],
    bannerType?: string,
    bucketDesign?: string,
    bucketId?: string,
    basketId?: string,
    bannerVersion?:any
}
export interface BlockSelectionState {
    selectedBlock: BlockObjType,
    blockOptions: BlockObjType[],
    blockConfigEnabled: boolean,
    isChanged: boolean
}
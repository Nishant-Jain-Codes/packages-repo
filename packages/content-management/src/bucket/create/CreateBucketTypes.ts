import React from "react";
import { Banner } from "@/utils/UtilityService";
import { popupType } from "@/types";
import { blockInnerComponent } from "@/utils/UtilityService";

export interface bucketTextFieldDataState {
    id: string,
    title: string,
    subtitle: string
}
export interface bucketBackgroundType {
    type?: string,
    backgroundColor?: string,
    backgroundImageBlobKey?: string
}
export type bucketType = "pieceSize" | "category" | "brand" | "smartBuy" | "subCategory" | "subBrand" | "pieceSizeDesc" | "brandCode" | "company" | "source" | "ctg" | "name" | "tenantId";
export interface bucketTypeOption {
    name?: any;
    pieceSize?: string,
    category?: string,
    brand?: string,
    smartBuy?: string,
    subCategory?: string,
    subBrand?: string,
    pieceSizeDesc?: string,
    brandCode?: string,
    company?: string,
    source?: string,
    ctg?: string
}
export interface secondaryTypesState {
    id: string,
    value: string,
    inputRef: HTMLInputElement | null;
    blobKey: string
    activeStatus?: boolean,
}
export interface primaryTypeState {
    id: string,
    value: string,
    inputRef: HTMLInputElement | null;
    blobKey: string
    secondaryTypeOptions?: secondaryTypesState[]
    activeStatus?: boolean,
    selectedSecondaryTypes?: string[],
    availableSecondaryTypes?: string[],
    color?: string
}

export type viewType = "create" | "partialEdit" | "edit";
export interface bucketCarouselFieldsProps {
    selectedPrimaryTypes: string[],
    primaryTypeOptions: string[],
    primaryType: string,
    selectedPrimaryTypesState: primaryTypeState[],
    setSelectedPrimaryTypesState: React.Dispatch<React.SetStateAction<primaryTypeState[]>>,
    setSelectedPrimaryTypes?: React.Dispatch<React.SetStateAction<string[]>>,
    setPrimaryTypeOptions?: React.Dispatch<React.SetStateAction<string[]>>,
    view: viewType,
    bucketTextFieldData: bucketTextFieldDataState,
    width?:any,
    heigth?:any,
    bucketDesign?: string,
    useSaleshub?: boolean
}
export interface bucketCarouselRowProps {
    id: string,
    value: string,
    elemNumber: number,
    selectedPrimaryTypesState: primaryTypeState[],
    inputRef: HTMLInputElement | null,
    setSelectedPrimaryTypesState: React.Dispatch<React.SetStateAction<primaryTypeState[]>>,
    setPrimaryTypeOptions?:  React.Dispatch<React.SetStateAction<string[]>>,
    primaryTypeOptions: string[],
    view: viewType,
    blobKey: string,
    width?:any,
    heigth?:any,
    bucketDesign?: string,
    useSaleshub?: boolean
}
export interface createBucketNavigate {
    buckets: any[],
    currentBucket: any,
    bucketConfiguration: any
    gridData?: gridOptionsData[],
    primaryTypesState?: primaryTypeState[],
    blockData?:any
}
export interface BucketGridFieldsProps {
    useSaleshub?: boolean,
    view: viewType,
    selectedPrimaryTypes: string[],
    primaryTypeOptions: string[], 
    primaryType: string, 
    selectedPrimaryTypesState: primaryTypeState[],
    setSelectedPrimaryTypesState: React.Dispatch<React.SetStateAction<primaryTypeState[]>>, 
    setSelectedPrimaryTypes: React.Dispatch<React.SetStateAction<string[]>>, 
    setPrimaryTypeOptions: React.Dispatch<React.SetStateAction<string[]>>,
    secondaryTypeOptions: string[]
    secondaryType: string,
    gridDataMapping: gridOptionsData[],
    gridDataLoader: boolean
}
export interface ImageGridCardProps {
    value: string,
    inputRef: HTMLInputElement | null,
    id: string,
    className?: string,
    selectedPrimaryTypesState: primaryTypeState[],
    setSelectedPrimaryTypesState: React.Dispatch<React.SetStateAction<primaryTypeState[]>>,
    isPrimaryType: boolean,
    primaryId: string,
    activeStatus: boolean,
    blobKey: string,
    color?: string,
    useSaleshub?: boolean
}
export interface gridOptionsData{
    name: string,
    secondaryOptions: string[]
}

export type UploadImageButtonType ={
    label:string,
    setImage: React.Dispatch<React.SetStateAction<File | null>>,
    image: File | null,
    defaultImage: string,
    setDefaultImage: React.Dispatch<React.SetStateAction<string>>,
    className?: string
    resolution: {
        height: number,
        width: number
    },
    size?:string,
    allowedType?:any,
    maxGifSize?: number;
    maxImageSize?: number;
    useSaleshub?: boolean;
}
export interface bucketTextFieldFlagState{
    id: boolean,
    title: boolean,
    subtitle: boolean,
}
export interface bucketInnerComponent{
    bannerId: string,
    bannerName: string
}
export interface CreateBucketProps{
    parentType?: "block",
    parentView?: viewType, //parentComponent View
    parentId?: string, 
    handleParentDataSubmit?: (innerComponent: blockInnerComponent) => Promise<void>,
    validateAllParentInputs?: () => string
    bannerId?: string
}
export interface BannerSelectionProps{
    selectedPrimaryTypesState: Banner[],
    setSelectedPrimaryTypesState: React.Dispatch<React.SetStateAction<Banner[]>>,
    view: viewType,
    bannerTemplates: string[],
    label: string,
    resolution: string;
}
export interface configFinalReqBody{
    domainName: string,
    domainValues: any[],
    domainType: string,
    lob: string
}
export type bucketSearchParams = "id" | "bucketDesign" | "title"